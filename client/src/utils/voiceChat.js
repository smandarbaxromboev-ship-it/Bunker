// WebRTC Audio Mesh Voice Chat Manager for Bunker
// Low-latency, high-quality audio with Web Audio API speech detection

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export class VoiceChatManager {
  constructor(socket) {
    this.socket = socket;
    this.localStream = null;
    this.peerConnections = new Map(); // socketId -> RTCPeerConnection
    this.audioElements = new Map(); // socketId -> HTMLAudioElement
    this.peers = new Map(); // socketId -> { playerId, playerName, isMuted, isSpeaking }
    this.roomCode = null;
    this.playerId = null;
    this.playerName = null;
    this.isMuted = false;
    this.isConnected = false;
    this.isSpeaking = false;

    // Web Audio Volume Analyser
    this.audioCtx = null;
    this.analyser = null;
    this.animFrameId = null;

    // Callbacks
    this.onPeersUpdate = null;
    this.onLocalSpeakingUpdate = null;
    this.onError = null;

    this.bindSocketEvents();
  }

  bindSocketEvents() {
    if (!this.socket) return;

    this.socket.on('voiceUserJoined', async ({ socketId, playerId, playerName, isMuted }) => {
      this.peers.set(socketId, { playerId, playerName, isMuted: Boolean(isMuted), isSpeaking: false });
      this.notifyPeersUpdate();

      // We initiate offer to the newly joined peer
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
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          this.socket.emit('voiceSignal', {
            toSocketId: fromSocketId,
            signal: answer
          });
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
        } else if (signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (err) {
        console.warn('[VOICE] Signal handling error:', err);
      }
    });

    this.socket.on('voiceStateUpdated', ({ socketId, isMuted, isSpeaking }) => {
      const peer = this.peers.get(socketId);
      if (peer) {
        if (isMuted !== undefined) peer.isMuted = isMuted;
        if (isSpeaking !== undefined) peer.isSpeaking = isSpeaking;
        this.notifyPeersUpdate();
      }
    });

    this.socket.on('voiceUserLeft', ({ socketId }) => {
      this.closePeer(socketId);
      this.peers.delete(socketId);
      this.notifyPeersUpdate();
    });
  }

  async joinVoice(roomCode, playerId, playerName) {
    if (this.isConnected) return;
    this.roomCode = roomCode;
    this.playerId = playerId;
    this.playerName = playerName;

    try {
      // 1. Get microphone audio stream
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      // Initially set local tracks to match mute state
      this.setLocalTracksEnabled(!this.isMuted);

      // 2. Setup audio analysis for local speech detection
      this.setupAudioAnalyser();

      // 3. Join voice room on server
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
            // We wait for the existing peers to send us offers, or initiate if needed
          }
          this.notifyPeersUpdate();
        }
      });

      this.isConnected = true;
    } catch (err) {
      console.warn('[VOICE] Microphone access error:', err);
      if (this.onError) {
        this.onError(err);
      }
      throw err;
    }
  }

  async createPeerConnection(remoteSocketId, isInitiator) {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peerConnections.set(remoteSocketId, pc);

    // Add local audio tracks to peer connection
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
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

    // Receive remote audio track
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (!this.audioElements.has(remoteSocketId)) {
        const audio = new Audio();
        audio.srcObject = remoteStream;
        audio.autoplay = true;
        audio.playsInline = true;
        this.audioElements.set(remoteSocketId, audio);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.closePeer(remoteSocketId);
      }
    };

    // If initiator, create and send offer
    if (isInitiator) {
      try {
        const offer = await pc.createOffer();
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
      const checkVolume = () => {
        if (!this.isConnected || !this.analyser) return;

        if (this.isMuted) {
          if (this.isSpeaking) {
            this.isSpeaking = false;
            this.emitSpeaking(false);
          }
          this.animFrameId = requestAnimationFrame(checkVolume);
          return;
        }

        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        // Threshold for human speech detection
        const nowSpeaking = average > 14;

        if (nowSpeaking) {
          speakingCounter = 12; // hold speaking state for ~200ms
        } else if (speakingCounter > 0) {
          speakingCounter--;
        }

        const isCurrentlySpeaking = speakingCounter > 0;
        if (isCurrentlySpeaking !== this.isSpeaking) {
          this.isSpeaking = isCurrentlySpeaking;
          this.emitSpeaking(this.isSpeaking);
        }

        this.animFrameId = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn('[VOICE] Web Audio analyser error:', e);
    }
  }

  emitSpeaking(speaking) {
    if (this.onLocalSpeakingUpdate) {
      this.onLocalSpeakingUpdate(speaking);
    }
    if (this.socket && this.isConnected) {
      this.socket.emit('voiceState', {
        roomCode: this.roomCode,
        isSpeaking: speaking,
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
      this.emitSpeaking(false);
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
