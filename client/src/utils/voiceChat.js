// WebRTC Audio Mesh Voice Chat Manager for Bunker
// Low-latency, high-quality audio with Web Audio API speech detection, background persistence, and auto-recovery

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' }
  ]
};

// 1-second silent WAV loop to ensure mobile browser (Android Chrome, iOS Safari) preserves audio in background
const SILENT_AUDIO_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

export class VoiceChatManager {
  constructor(socket) {
    this.socket = socket;
    this.localStream = null;
    this.peerConnections = new Map(); // socketId -> RTCPeerConnection
    this.audioElements = new Map(); // socketId -> HTMLAudioElement
    this.pendingCandidates = new Map(); // socketId -> RTCIceCandidateInit[]
    this.peers = new Map(); // socketId -> { playerId, playerName, isMuted, isSpeaking }
    this.roomCode = null;
    this.playerId = null;
    this.playerName = null;
    this.isMuted = false;
    this.isConnected = false;
    this.isSpeaking = false;
    this.isLoud = false;

    // Web Audio Volume Analyser
    this.audioCtx = null;
    this.analyser = null;
    this.animFrameId = null;
    this.bgCheckTimeout = null;

    // Background Audio & WakeLock state
    this.keepAliveAudio = null;
    this.wakeLock = null;

    // Callbacks
    this.onPeersUpdate = null;
    this.onLocalSpeakingUpdate = null;
    this.onError = null;

    this.bindSocketEvents();
    this.setupAudioUnlocker();
    this.setupVisibilityHandler();
  }

  setupAudioUnlocker() {
    const unlock = () => {
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      if (this.keepAliveAudio && this.keepAliveAudio.paused && this.isConnected) {
        this.keepAliveAudio.play().catch(() => {});
      }
      this.audioElements.forEach((audio) => {
        if (audio && audio.paused) {
          audio.play().catch(() => {});
        }
      });
    };
    window.addEventListener('click', unlock);
    window.addEventListener('touchstart', unlock);
    this._unlockHandler = unlock;
  }

  setupVisibilityHandler() {
    this._visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        this.onForeground();
      }
    };
    document.addEventListener('visibilitychange', this._visibilityHandler);
  }

  onForeground() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    if (this.keepAliveAudio && this.keepAliveAudio.paused && this.isConnected) {
      this.keepAliveAudio.play().catch(() => {});
    }
    this.audioElements.forEach((audio) => {
      if (audio && audio.paused) {
        audio.play().catch(() => {});
      }
    });
    if (this.isConnected) {
      this.requestWakeLock();
      this.updateMediaSession();
      // Sync state with server in case mobile OS temporarily paused socket
      this.syncWithServer();
    }
  }

  async requestWakeLock() {
    if ('wakeLock' in navigator && !this.wakeLock && this.isConnected) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
        });
      } catch (e) {
        // WakeLock request can fail if screen is already locked or battery saver is active
      }
    }
  }

  releaseWakeLock() {
    if (this.wakeLock) {
      try {
        this.wakeLock.release();
      } catch (e) {}
      this.wakeLock = null;
    }
  }

  startKeepAliveAudio() {
    if (!this.keepAliveAudio) {
      this.keepAliveAudio = document.createElement('audio');
      this.keepAliveAudio.id = 'bunker_voice_keepalive';
      this.keepAliveAudio.src = SILENT_AUDIO_WAV;
      this.keepAliveAudio.loop = true;
      this.keepAliveAudio.volume = 0.01;
      this.keepAliveAudio.autoplay = true;
      this.keepAliveAudio.playsInline = true;
      this.keepAliveAudio.setAttribute('playsinline', '');
      this.keepAliveAudio.setAttribute('webkit-playsinline', '');
      this.keepAliveAudio.style.display = 'none';
      document.body.appendChild(this.keepAliveAudio);
    }
    this.keepAliveAudio.play().catch(() => {});
  }

  stopKeepAliveAudio() {
    if (this.keepAliveAudio) {
      try {
        this.keepAliveAudio.pause();
        this.keepAliveAudio.src = '';
        this.keepAliveAudio.remove();
      } catch (e) {}
      this.keepAliveAudio = null;
    }
  }

  updateMediaSession() {
    if ('mediaSession' in navigator) {
      try {
        const isDm = this.roomCode && String(this.roomCode).startsWith('dm_voice_');
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: isDm ? 'Бункер — Звонок с другом' : 'Бункер — Голосовой чат',
          artist: isDm ? 'Личный аудиочат' : (this.roomCode ? `Комната #${this.roomCode}` : 'В эфире'),
          album: 'Bunker Survival Online',
          artwork: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
          ]
        });
        navigator.mediaSession.playbackState = 'playing';

        navigator.mediaSession.setActionHandler('pause', () => {
          this.setMute(true);
        });
        navigator.mediaSession.setActionHandler('play', () => {
          this.setMute(false);
        });
        navigator.mediaSession.setActionHandler('stop', () => {
          this.leaveVoice();
        });
        try {
          navigator.mediaSession.setActionHandler('togglemicrophone', () => {
            this.toggleMute();
          });
        } catch (e) {}
      } catch (e) {
        console.warn('[VOICE] MediaSession setup warning:', e);
      }
    }
  }

  clearMediaSession() {
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'none';
      } catch (e) {}
    }
  }

  bindSocketEvents() {
    if (!this.socket) return;

    this.socket.on('voiceUserJoined', async ({ socketId, playerId, playerName, isMuted }) => {
      this.peers.set(socketId, { playerId, playerName, isMuted: Boolean(isMuted), isSpeaking: false });
      this.notifyPeersUpdate();

      // Existing peers initiate offer to the newcomer
      if (this.localStream) {
        await this.createPeerConnection(socketId, true);
      }
    });

    this.socket.on('voiceSignal', async ({ fromSocketId, signal }) => {
      try {
        let pc = this.peerConnections.get(fromSocketId);
        if (!pc) {
          pc = await this.createPeerConnection(fromSocketId, false);
        }

        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          // Drain pending candidates received before remoteDescription
          await this.drainPendingCandidates(fromSocketId, pc);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          this.socket.emit('voiceSignal', {
            toSocketId: fromSocketId,
            signal: answer
          });
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          // Drain pending candidates received before answer was set
          await this.drainPendingCandidates(fromSocketId, pc);
        } else if (signal.candidate) {
          if (!pc.remoteDescription || !pc.remoteDescription.type) {
            if (!this.pendingCandidates.has(fromSocketId)) {
              this.pendingCandidates.set(fromSocketId, []);
            }
            this.pendingCandidates.get(fromSocketId).push(signal.candidate);
          } else {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch((e) => {
              console.warn('[VOICE] Add ICE candidate warning:', e);
            });
          }
        }
      } catch (err) {
        console.warn('[VOICE] Signal handling error:', err);
      }
    });

    this.socket.on('voiceStateUpdated', ({ socketId, isMuted, isSpeaking, isLoud }) => {
      const peer = this.peers.get(socketId);
      if (peer) {
        if (isMuted !== undefined) peer.isMuted = isMuted;
        if (isSpeaking !== undefined) peer.isSpeaking = isSpeaking;
        if (isLoud !== undefined) peer.isLoud = isLoud;
        this.notifyPeersUpdate();
      }
    });

    this.socket.on('voiceUserLeft', ({ socketId }) => {
      this.closePeer(socketId);
      this.peers.delete(socketId);
      this.notifyPeersUpdate();
    });
  }

  async drainPendingCandidates(socketId, pc) {
    const list = this.pendingCandidates.get(socketId) || [];
    while (list.length > 0) {
      const cand = list.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(cand));
      } catch (e) {
        console.warn('[VOICE] Drain candidate error:', e);
      }
    }
  }

  async joinVoice(roomCode, playerId, playerName) {
    if (this.isConnected) {
      if (this.roomCode === roomCode) return;
      this.leaveVoice();
    }
    this.roomCode = roomCode;
    this.playerId = playerId;
    this.playerName = playerName;

    try {
      // 1. Get microphone audio stream with advanced acoustic echo cancellation & noise suppression
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
          googEchoCancellation: { ideal: true },
          googEchoCancellation2: { ideal: true },
          googAutoGainControl: { ideal: true },
          googNoiseSuppression: { ideal: true },
          googHighpassFilter: { ideal: true },
          googTypingNoiseDetection: { ideal: true },
          channelCount: { ideal: 1 } // mono audio prevents acoustic speaker-mic phase echo
        },
        video: false
      });

      // Initially set local tracks to match mute state
      this.setLocalTracksEnabled(!this.isMuted);

      // 2. Setup audio analysis for local speech detection (supports background tabs)
      this.setupAudioAnalyser();

      // 3. Start keepalive background audio, MediaSession notification, and Screen WakeLock
      this.startKeepAliveAudio();
      this.updateMediaSession();
      this.requestWakeLock();

      // 4. Join voice room on server
      this.socket.emit('voiceJoin', {
        roomCode,
        playerId,
        playerName,
        isMuted: this.isMuted
      }, async (res) => {
        if (res && res.peers) {
          for (const peer of res.peers) {
            this.peers.set(peer.socketId, {
              playerId: peer.playerId,
              playerName: peer.playerName,
              isMuted: Boolean(peer.isMuted),
              isSpeaking: Boolean(peer.isSpeaking)
            });
            // If existing peers haven't offered within 1.2s, newcomer initiates
            setTimeout(async () => {
              if (!this.peerConnections.has(peer.socketId) && this.localStream && this.isConnected) {
                await this.createPeerConnection(peer.socketId, true);
              }
            }, 1200);
          }
          this.notifyPeersUpdate();
        }
      });

      this.isConnected = true;
    } catch (err) {
      console.warn('[VOICE] Microphone access error:', err);
      this.stopKeepAliveAudio();
      this.releaseWakeLock();
      this.clearMediaSession();
      if (this.onError) {
        this.onError(err);
      }
      throw err;
    }
  }

  syncWithServer() {
    if (!this.isConnected || !this.socket || !this.roomCode) return;
    this.socket.emit('voiceJoin', {
      roomCode: this.roomCode,
      playerId: this.playerId,
      playerName: this.playerName,
      isMuted: this.isMuted
    }, async (res) => {
      if (res && res.peers) {
        for (const peer of res.peers) {
          this.peers.set(peer.socketId, {
            playerId: peer.playerId,
            playerName: peer.playerName,
            isMuted: Boolean(peer.isMuted),
            isSpeaking: Boolean(peer.isSpeaking)
          });
          if (!this.peerConnections.has(peer.socketId) && this.localStream && this.isConnected) {
            await this.createPeerConnection(peer.socketId, true);
          }
        }
        this.notifyPeersUpdate();
      }
    });
  }

  async createPeerConnection(remoteSocketId, isInitiator) {
    if (this.peerConnections.has(remoteSocketId)) {
      return this.peerConnections.get(remoteSocketId);
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peerConnections.set(remoteSocketId, pc);

    // Add local audio tracks to peer connection
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !this.isMuted;
        pc.addTrack(track, this.localStream);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('voiceSignal', {
          toSocketId: remoteSocketId,
          signal: { candidate: event.candidate }
        });
      }
    };

    // Receive remote audio track - attach to DOM to guarantee autoplay in Chrome/Safari/Edge
    pc.ontrack = (event) => {
      if (remoteSocketId === this.socket?.id) return; // Never play own voice locally (prevents self-echo)
      const stream = (event.streams && event.streams[0]) ? event.streams[0] : new MediaStream([event.track]);
      let audio = this.audioElements.get(remoteSocketId);
      if (!audio) {
        audio = document.createElement('audio');
        audio.id = `remote_voice_${remoteSocketId}`;
        audio.autoplay = true;
        audio.playsInline = true;
        audio.setAttribute('playsinline', '');
        audio.setAttribute('webkit-playsinline', '');
        audio.style.display = 'none';
        document.body.appendChild(audio);
        this.audioElements.set(remoteSocketId, audio);
      }
      if (audio.srcObject !== stream) {
        audio.srcObject = stream;
      }
      audio.play().catch((err) => {
        console.warn('[VOICE] Audio playback waiting for gesture:', err);
      });
    };

    pc.onconnectionstatechange = () => {
      // Only close on terminal failure or closure; 'disconnected' can self-heal during app switch
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.closePeer(remoteSocketId);
      }
    };

    // If initiator, create and send offer
    if (isInitiator) {
      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true
        });
        await pc.setLocalDescription(offer);
        this.socket.emit('voiceSignal', {
          toSocketId: remoteSocketId,
          signal: offer
        });
      } catch (err) {
        console.warn('[VOICE] Error creating offer:', err);
      }
    }

    return pc;
  }

  setupAudioAnalyser() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass || !this.localStream) return;

      this.audioCtx = new AudioContextClass();
      const source = this.audioCtx.createMediaStreamSource(this.localStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.4;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let speakingCounter = 0;
      const scheduleNextCheck = () => {
        if (!this.isConnected || !this.analyser) return;
        if (typeof document !== 'undefined' && document.hidden) {
          this.bgCheckTimeout = setTimeout(checkVolume, 150);
        } else {
          this.animFrameId = requestAnimationFrame(checkVolume);
        }
      };

      const checkVolume = () => {
        if (!this.isConnected || !this.analyser) return;

        if (this.isMuted) {
          if (this.isSpeaking) {
            this.isSpeaking = false;
            this.isLoud = false;
            this.emitSpeaking(false, false);
          }
          scheduleNextCheck();
          return;
        }

        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        // Threshold for human speech detection & loud speech detection
        const nowSpeaking = average > 14;
        const nowLoud = average > 42;

        if (nowSpeaking) {
          speakingCounter = 12; // hold speaking state for ~200ms
        } else if (speakingCounter > 0) {
          speakingCounter--;
        }

        const isCurrentlySpeaking = speakingCounter > 0;
        const isCurrentlyLoud = isCurrentlySpeaking && nowLoud;

        if (isCurrentlySpeaking !== this.isSpeaking || isCurrentlyLoud !== this.isLoud) {
          this.isSpeaking = isCurrentlySpeaking;
          this.isLoud = isCurrentlyLoud;
          this.emitSpeaking(this.isSpeaking, this.isLoud);
        }

        scheduleNextCheck();
      };

      scheduleNextCheck();
    } catch (e) {
      console.warn('[VOICE] Web Audio analyser error:', e);
    }
  }

  emitSpeaking(speaking, isLoud = false) {
    if (this.onLocalSpeakingUpdate) {
      this.onLocalSpeakingUpdate(speaking, isLoud);
    }
    if (this.socket && this.isConnected) {
      this.socket.emit('voiceState', {
        roomCode: this.roomCode,
        isSpeaking: speaking,
        isLoud: isLoud,
        isMuted: this.isMuted
      });
    }
  }

  toggleMute() {
    this.setMute(!this.isMuted);
    return this.isMuted;
  }

  setMute(muted) {
    this.isMuted = muted;
    this.setLocalTracksEnabled(!muted);

    if (this.socket && this.isConnected) {
      this.socket.emit('voiceState', {
        roomCode: this.roomCode,
        isMuted: this.isMuted,
        isSpeaking: false
      });
    }
    if (this.isMuted && this.isSpeaking) {
      this.isSpeaking = false;
      this.isLoud = false;
      this.emitSpeaking(false, false);
    }
  }

  setLocalTracksEnabled(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  leaveVoice() {
    if (!this.isConnected) return;

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.bgCheckTimeout) {
      clearTimeout(this.bgCheckTimeout);
      this.bgCheckTimeout = null;
    }

    this.stopKeepAliveAudio();
    this.releaseWakeLock();
    this.clearMediaSession();

    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close();
      } catch (e) {}
      this.audioCtx = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }

    for (const [socketId] of this.peerConnections) {
      this.closePeer(socketId);
    }
    this.peerConnections.clear();
    this.peers.clear();

    if (this.socket && this.roomCode) {
      this.socket.emit('voiceLeave', { roomCode: this.roomCode });
    }

    this.roomCode = null;
    this.isConnected = false;
    this.isSpeaking = false;
    this.notifyPeersUpdate();
    if (this.onLocalSpeakingUpdate) {
      this.onLocalSpeakingUpdate(false);
    }
  }

  closePeer(socketId) {
    const pc = this.peerConnections.get(socketId);
    if (pc) {
      try {
        pc.close();
      } catch (e) {}
      this.peerConnections.delete(socketId);
    }

    const audio = this.audioElements.get(socketId);
    if (audio) {
      try {
        audio.pause();
        audio.srcObject = null;
        audio.remove();
      } catch (e) {}
      this.audioElements.delete(socketId);
    }
  }

  setPeerVolume(socketId, volume) {
    const audio = this.audioElements.get(socketId);
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  notifyPeersUpdate() {
    if (this.onPeersUpdate) {
      const list = [];
      for (const [socketId, data] of this.peers.entries()) {
        list.push({ socketId, ...data });
      }
      this.onPeersUpdate(list);
    }
  }
}
