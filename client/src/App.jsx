import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { 
  ShieldAlert, Users, LogIn, PlusCircle, Radio, 
  Terminal, AlertOctagon, HelpCircle, Trophy, Ghost,
  MessageSquare, Sparkles, CheckSquare, Sun, Moon, Vote
} from 'lucide-react';
import { soundManager } from './utils/audio';
import { translations, getLocalized } from './utils/translations';

import HeaderTerminal from './components/HeaderTerminal';
import LobbyView from './components/LobbyView';
import PlayerCard from './components/PlayerCard';
import CardRevealModal from './components/CardRevealModal';
import VotingModal from './components/VotingModal';
import RoundResultModal from './components/RoundResultModal';
import GameOverView from './components/GameOverView';
import ChatPanel from './components/ChatPanel';
import GhostVisionHUD from './components/GhostVisionHUD';
import CardDetailModal from './components/CardDetailModal';
import TrumpActionModal from './components/TrumpActionModal';
import AuthModal from './components/AuthModal';
import ShopModal from './components/ShopModal';
import AdminPageView from './components/AdminPageView';
import BunkerLogo from './components/BunkerLogo';
import AtmosphereEffects from './components/AtmosphereEffects';
import RulesModal from './components/RulesModal';
import ProfileModal from './components/ProfileModal';
import FriendsModal from './components/FriendsModal';
import DailyCrateModal from './components/DailyCrateModal';
import NotFoundView from './components/NotFoundView';
import InstallAppModal from './components/InstallAppModal';
import AmongUsEjectionScreen from './components/AmongUsEjectionScreen';
import VoiceChatBar from './components/VoiceChatBar';
import VoiceChatModal from './components/VoiceChatModal';
import { VoiceChatManager } from './utils/voiceChat';

const SECRET_ADMIN_PATH = import.meta.env.VITE_ADMIN_SECRET_PATH || '/samandar-bunker-hq-0505';

const BACKEND_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? undefined 
  : "https://bunker-ymqm.onrender.com";

const socket = io(BACKEND_URL);

// Вспомогательный компонент для обработки возврата из всплывающего окна Google
function GoogleAuthCallbackView({ socket, onSuccess }) {
  const [status, setStatus] = useState('loading');
  const [userName, setUserName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const finishAuth = (finalUser) => {
    try {
      const bc = new BroadcastChannel('bunker_google_auth');
      bc.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', user: finalUser });
    } catch (e) {}

    if (window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', user: finalUser }, '*');
      } catch (e) {}
    }

    try {
      localStorage.setItem('bunker_last_google_user', JSON.stringify(finalUser));
      localStorage.setItem('bunker_user_v3', JSON.stringify(finalUser));
    } catch (e) {}

    if (typeof onSuccess === 'function') {
      onSuccess(finalUser);
    }

    setTimeout(() => {
      try { window.close(); } catch (e) {}
      window.location.replace('/');
    }, 450);
  };

  const handleDirectGoogleLogin = () => {
    const savedRaw = localStorage.getItem('bunker_user_v3') || localStorage.getItem('bunker_last_google_user');
    let clientUser = null;
    try { if (savedRaw) clientUser = JSON.parse(savedRaw); } catch (e) {}

    const defaultName = clientUser?.username || clientUser?.name || 'GooglePlayer';
    const chosenName = window.prompt('Введите ваше имя игрока или Google Email для мгновенного входа:', defaultName);
    if (!chosenName || !chosenName.trim()) return;

    setStatus('loading');
    const cleanName = chosenName.trim();
    const isEmail = cleanName.includes('@');
    const safeUsername = isEmail ? cleanName.split('@')[0] : cleanName;

    if (socket) {
      socket.emit('googleDirectLogin', {
        email: isEmail ? cleanName : null,
        name: safeUsername,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(safeUsername)}&background=4285F4&color=fff&size=256&bold=true`,
        googleId: 'g_' + safeUsername.toLowerCase().replace(/[^\w\d]/g, '_'),
        clientUser
      }, (res) => {
        if (res && res.success && res.user) {
          setUserName(res.user.username);
          setStatus('success');
          finishAuth(res.user);
        } else {
          setErrorMessage(res?.error || 'Не удалось завершить быстрый вход');
          setStatus('error');
        }
      });
    } else {
      const fallbackUser = {
        username: safeUsername,
        googleEmail: isEmail ? cleanName : null,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(safeUsername)}&background=4285F4&color=fff&size=256&bold=true`,
        bunCoins: 1000
      };
      setUserName(fallbackUser.username);
      setStatus('success');
      finishAuth(fallbackUser);
    }
  };

  useEffect(() => {
    let timer = null;
    let didFinish = false;

    async function processGoogleAuth() {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');
        const googleError = searchParams.get('error');
        const googleErrorDesc = searchParams.get('error_description');

        if (googleError) {
          const friendly = googleError === 'access_denied'
            ? 'Доступ ограничен Google (тестовый режим). Нажмите кнопку быстрого входа ниже, чтобы мгновенно войти с вашим аккаунтом!'
            : (googleErrorDesc || googleError);
          setErrorMessage(friendly);
          setStatus('error');
          return;
        }

        // 1. Обработка через код авторизации (?code=...)
        const savedRaw = localStorage.getItem('bunker_user_v3') || localStorage.getItem('bunker_last_google_user');
        let clientUser = null;
        try { if (savedRaw) clientUser = JSON.parse(savedRaw); } catch (e) {}

        if (code) {
          // Timeout protection: if socket takes > 6s, show helpful error and 1-click fallback
          timer = setTimeout(() => {
            if (!didFinish) {
              setErrorMessage('Сервер авторизации отвечает дольше обычного. Вы можете войти в 1 клик с помощью кнопки ниже!');
              setStatus('error');
            }
          }, 6000);

          const tryExchange = () => {
            if (!socket) return;
            socket.emit('exchangeGoogleCode', {
              code,
              redirectUri: window.location.origin,
              clientUser
            }, (res) => {
              didFinish = true;
              if (timer) clearTimeout(timer);
              if (res && res.success && res.user) {
                setUserName(res.user.username);
                setStatus('success');
                finishAuth(res.user);
              } else {
                console.error('Ошибка обмена кода:', res?.error);
                setErrorMessage(res?.error || 'Не удалось подтвердить код Google');
                setStatus('error');
              }
            });
          };

          if (socket.connected) {
            tryExchange();
          } else {
            socket.once('connect', tryExchange);
          }
          return;
        }

        // 2. Читаем токен из хэша URL (#access_token=...)
        if (window.location.hash && window.location.hash.includes('access_token')) {
          const params = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = params.get('access_token');
          if (accessToken) {
            const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (resp.ok) {
              const info = await resp.json();
              const profile = {
                name: info.name || (info.email ? info.email.split('@')[0] : 'Player'),
                email: info.email,
                picture: info.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(info.name || 'G')}&background=4285F4&color=fff&size=256&bold=true`,
                googleId: 'google-' + info.sub
              };

              setUserName(profile.name);
              setStatus('success');

              if (socket) {
                socket.emit('googleDirectLogin', {
                  email: profile.email,
                  name: profile.name,
                  avatarUrl: profile.picture,
                  googleId: profile.googleId,
                  clientUser
                }, (res) => {
                  const finalUser = (res && res.success && res.user) ? res.user : {
                    username: profile.name,
                    googleEmail: profile.email,
                    avatarUrl: profile.picture,
                    bunCoins: 1000
                  };
                  finishAuth(finalUser);
                });
              } else {
                finishAuth({
                  username: profile.name,
                  googleEmail: profile.email,
                  avatarUrl: profile.picture,
                  bunCoins: 1000
                });
              }
              return;
            }
          }
        }

        setStatus('error');
      } catch (err) {
        console.error('Ошибка обработки Google авторизации:', err);
        setStatus('error');
      }
    }

    processGoogleAuth();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [socket, onSuccess]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-750 rounded-3xl p-6 shadow-2xl space-y-4">
        {status === 'loading' && (
          <>
            <div className="w-12 h-12 border-3 border-zinc-700 border-t-blue-500 rounded-full animate-spin mx-auto" />
            <h2 className="text-base font-bold text-white">Вход через Google...</h2>
            <p className="text-xs text-zinc-400">Связь с сервером и подтверждение аккаунта...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">✓</div>
            <h2 className="text-base font-bold text-emerald-400">Вход выполнен успешно!</h2>
            <p className="text-xs text-zinc-300 font-mono">{userName}</p>
            <p className="text-[11px] text-zinc-500">Возврат в Бункер 7...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-500/20 border-2 border-red-500 text-red-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">✕</div>
            <h2 className="text-base font-bold text-red-400">Не удалось завершить вход</h2>
            <p className="text-xs text-zinc-400 break-words px-2 leading-relaxed">
              {errorMessage || 'Попробуйте закрыть окно и нажать вход снова.'}
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleDirectGoogleLogin}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 transition active:scale-95"
              >
                <span>⚡ Быстрый вход с аккаунтом Google</span>
              </button>
              <button
                type="button"
                onClick={() => { try { window.close(); } catch(e){} window.location.replace('/'); }}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono rounded-xl cursor-pointer transition"
              >
                Закрыть окно
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const [inRoom, setInRoom] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('bunker_theme') || 'dark');
  const [lang, setLang] = useState(() => localStorage.getItem('bunker_lang') || 'ru');
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('bunker_user_v3');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [playerName, setPlayerName] = useState(() => {
    const savedUser = localStorage.getItem('bunker_user_v3');
    if (savedUser) {
      try { return JSON.parse(savedUser).username; } catch (e) {}
    }
    return localStorage.getItem('bunker_player_name') || '';
  });
  const [joinCode, setJoinCode] = useState('');
  const [myPlayerId, setMyPlayerId] = useState(() => localStorage.getItem('bunker_player_id') || '');
  const [roomState, setRoomState] = useState(null);
  const myPlayer = roomState?.players?.find((p) => p.id === myPlayerId);
  const isAlive = myPlayer ? myPlayer.isAlive : true;
  const isHost = roomState?.hostId === myPlayerId;
  const isChatLocked = false;
  const [errorMessage, setErrorMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [mobileTab, setMobileTab] = useState('bunker'); // 'bunker' | 'chat'
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [inspectCardData, setInspectCardData] = useState(null); // { player, card }
  const [activeTrumpCard, setActiveTrumpCard] = useState(null);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [initialChatFriend, setInitialChatFriend] = useState(null);
  const [unreadDmCount, setUnreadDmCount] = useState(0);
  const [pendingDmNotice, setPendingDmNotice] = useState(null);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [publicRooms, setPublicRooms] = useState([]);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [isRulesMandatory, setIsRulesMandatory] = useState(false);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(() => {
    return typeof window !== 'undefined' ? window.__deferredInstallPrompt || null : null;
  });
  const [isAppInstalled, setIsAppInstalled] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isStandalone =
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator?.standalone === true ||
      document.referrer.includes('android-app://');
    return isStandalone || localStorage.getItem('bunker_app_installed') === 'true';
  });
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [atmosphereEnabled, setAtmosphereEnabled] = useState(() => {
    return localStorage.getItem('bunker_atmosphere') !== 'false';
  });
  const [showAmongUsEjection, setShowAmongUsEjection] = useState(false);
  const [hasShownEjectionForRound, setHasShownEjectionForRound] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});

  // Live WebRTC Group Voice Chat
  const voiceManagerRef = useRef(null);
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState(false);
  const [voicePeers, setVoicePeers] = useState([]);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  useEffect(() => {
    const vm = new VoiceChatManager(socket);
    vm.onPeersUpdate = (peersList) => {
      setVoicePeers(peersList);
    };
    vm.onLocalSpeakingUpdate = (speaking) => {
      setIsVoiceSpeaking(speaking);
    };
    vm.onError = (err) => {
      console.warn('[VOICE] Error:', err);
    };
    voiceManagerRef.current = vm;

    return () => {
      vm.leaveVoice();
    };
  }, []);

  const speakingPlayerIds = new Set();
  if (isVoiceSpeaking && myPlayerId) {
    speakingPlayerIds.add(myPlayerId);
  }
  voicePeers.forEach((peer) => {
    if (peer.isSpeaking && peer.playerId) {
      speakingPlayerIds.add(peer.playerId);
    }
  });

  const handleOpenVoiceChat = () => {
    setShowVoiceModal(true);
    if (!isVoiceConnected && roomState) {
      voiceManagerRef.current?.joinVoice(roomState.code, myPlayerId, myPlayer?.name || playerName)
        .then(() => setIsVoiceConnected(true))
        .catch((err) => {
          console.warn('[VOICE] Auto-connect failed:', err);
        });
    }
  };

  const applyNormalizedRoomState = (newState) => {
    if (!newState) {
      setRoomState(null);
      return;
    }
    const normalized = {
      ...newState,
      timerExpiresAt:
        newState.timerRemainingMs != null
          ? Date.now() + Number(newState.timerRemainingMs)
          : newState.timerExpiresAt
    };
    setRoomState(normalized);
  };

  useEffect(() => {
    if (window.__deferredInstallPrompt) {
      setDeferredInstallPrompt(window.__deferredInstallPrompt);
    }

    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.__deferredInstallPrompt = e;
      setDeferredInstallPrompt(e);
    };
    const onPwaReady = () => {
      if (window.__deferredInstallPrompt) {
        setDeferredInstallPrompt(window.__deferredInstallPrompt);
      }
    };
    const onAppInstalled = () => {
      window.__deferredInstallPrompt = null;
      setDeferredInstallPrompt(null);
      setIsAppInstalled(true);
      try {
        localStorage.setItem('bunker_app_installed', 'true');
      } catch (e) {}
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('bunker-pwa-ready', onPwaReady);
    window.addEventListener('appinstalled', onAppInstalled);
    window.addEventListener('bunker-pwa-installed', onAppInstalled);

    if (navigator.getInstalledRelatedApps) {
      navigator.getInstalledRelatedApps().then((apps) => {
        if (Array.isArray(apps) && apps.length > 0) {
          onAppInstalled();
        }
      }).catch(() => {});
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('bunker-pwa-ready', onPwaReady);
      window.removeEventListener('appinstalled', onAppInstalled);
      window.removeEventListener('bunker-pwa-installed', onAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    soundManager.playBeep(900, 0.08);
    const promptObj = deferredInstallPrompt || window.__deferredInstallPrompt;
    if (promptObj) {
      try {
        promptObj.prompt();
        const choice = await promptObj.userChoice;
        window.__deferredInstallPrompt = null;
        setDeferredInstallPrompt(null);
        if (choice && choice.outcome === 'accepted') {
          setIsAppInstalled(true);
          localStorage.setItem('bunker_app_installed', 'true');
          return;
        }
      } catch (e) {}
    }
    // Открываем окно установки APK + ярлыка на главный экран телефона!
    setShowInstallModal(true);
  };

  const handleToggleAtmosphere = (val) => {
    setAtmosphereEnabled(val);
    localStorage.setItem('bunker_atmosphere', String(val));
  };

  const prevStatusRef = useRef(null);
  const prevRoundRef = useRef(null);
  const hasAutoOpenedForTurnRef = useRef(false);

  // Auto-open reveal and result modals on round phase change (never spam on bot turns or vote updates!)
  useEffect(() => {
    const currentStatus = roomState?.status;
    const currentRound = roomState?.currentRound;
    const isStatusChanged = currentStatus !== prevStatusRef.current;
    const isRoundChanged = currentRound !== prevRoundRef.current;

    if (isStatusChanged || isRoundChanged) {
      prevStatusRef.current = currentStatus;
      prevRoundRef.current = currentRound;

      if (currentStatus === 'ROUND_REVEAL') {
        hasAutoOpenedForTurnRef.current = false;
        setShowAmongUsEjection(false);
        // Only auto-open if it is ALREADY the current player's turn to reveal
        if (roomState.activeTurnPlayerId === myPlayerId && !myPlayer?.hasRevealedThisRound) {
          setShowRevealModal(true);
          hasAutoOpenedForTurnRef.current = true;
        } else {
          setShowRevealModal(false);
        }
      } else if (currentStatus === 'ROUND_DISCUSSION') {
        setShowRevealModal(false);
        setShowVotingModal(false);
        setShowAmongUsEjection(false);
      } else if (currentStatus === 'ROUND_VOTING') {
        setShowRevealModal(false);
        setShowVotingModal(false); // Voting happens directly on player cards without any intrusive popups!
        setShowAmongUsEjection(false);
      } else if (currentStatus === 'ROUND_RESULT') {
        setShowRevealModal(false);
        setShowVotingModal(false);
        const exiled = roomState.votingResults?.exiledPlayer;
        if (exiled && hasShownEjectionForRound !== currentRound) {
          setShowAmongUsEjection(true);
          setHasShownEjectionForRound(currentRound);
          setShowResultModal(false);
        } else {
          setShowResultModal(true);
        }
      }
    } else if (currentStatus === 'ROUND_REVEAL') {
      // Phase did NOT change, but active turn changed
      // Only auto-open ONCE when activeTurnPlayerId becomes myPlayerId
      if (
        roomState?.activeTurnPlayerId === myPlayerId &&
        !myPlayer?.hasRevealedThisRound &&
        !hasAutoOpenedForTurnRef.current
      ) {
        hasAutoOpenedForTurnRef.current = true;
        setShowRevealModal(true);
      }
      // If it's a bot's turn: NEVER auto-open! User can browse the table and cards freely!
    }
  }, [roomState?.status, roomState?.currentRound, roomState?.activeTurnPlayerId, roomState?.votingResults, myPlayerId, myPlayer?.hasRevealedThisRound, hasShownEjectionForRound]);

  // URL Popstate tracking for /admin and /
  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const handleLeaveRoom = () => {
    const codeToLeave = roomState?.code || localStorage.getItem('bunker_room_code');
    const idToLeave = myPlayerId || localStorage.getItem('bunker_player_id');

    localStorage.removeItem('bunker_room_code');
    localStorage.removeItem('bunker_player_id');

    if (codeToLeave) {
      socket.emit('leaveRoom', { roomCode: codeToLeave, playerId: idToLeave });
    }

    voiceManagerRef.current?.leaveVoice();
    setIsVoiceConnected(false);
    setIsVoiceSpeaking(false);
    setVoicePeers([]);

    setShowVotingModal(false);
    setShowResultModal(false);
    setActiveTrumpCard(null);
    setInspectCardData(null);
    setInRoom(false);
    setRoomState(null);
    setMyPlayerId('');
  };

  const t = translations[lang] || translations.ru;

  // Handle theme change on <html>
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    localStorage.setItem('bunker_theme', theme);
  }, [theme]);

  const handleSetLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('bunker_lang', newLang);
  };

  useEffect(() => {
    const fetchPublicRooms = () => {
      socket.emit('getPublicRooms', {}, (res) => {
        if (res && res.success && Array.isArray(res.rooms)) {
          setPublicRooms(res.rooms);
        }
      });
    };

    fetchPublicRooms();

    socket.on('connect', () => {
      console.log('Подключено к серверу:', socket.id);
      fetchPublicRooms();
      const mySavedUser = localStorage.getItem('bunker_user_v3');
      if (mySavedUser) {
        try {
          const parsedUser = JSON.parse(mySavedUser);
          if (parsedUser?.username) {
            socket.emit('getProfile', { username: parsedUser.username, fallbackUser: parsedUser });
          }
        } catch (e) {}
      }
      const savedCode = localStorage.getItem('bunker_room_code');
      const savedId = localStorage.getItem('bunker_player_id');
      if (savedCode && savedId) {
        socket.emit('reconnectSession', { roomCode: savedCode, playerId: savedId }, (res) => {
          if (res && !res.error && res.room) {
            applyNormalizedRoomState(res.room);
            setMyPlayerId(res.playerId);
            setInRoom(true);
          }
        });
      }
    });

    socket.on('publicRoomsUpdated', (rooms) => {
      if (Array.isArray(rooms)) {
        setPublicRooms(rooms);
      }
    });

    socket.on('roomStateUpdate', (newState) => {
      const savedCode = localStorage.getItem('bunker_room_code');
      // Если игрок уже вышел в главное меню, игнорируем запаздывающие пакеты от старой комнаты
      if (!savedCode || (newState?.code && savedCode !== newState.code)) {
        return;
      }
      applyNormalizedRoomState(newState);
      setInRoom(true);
    });

    socket.on('directMessageReceived', (msg) => {
      if (!msg || !msg.to || !msg.from) return;
      const mySaved = localStorage.getItem('bunker_user_v3');
      if (!mySaved) return;
      try {
        const parsed = JSON.parse(mySaved);
        if (parsed.username && parsed.username.toLowerCase() === msg.to.toLowerCase() && parsed.username.toLowerCase() !== msg.from.toLowerCase()) {
          soundManager.playBeep(1080, 0.1);
          setUnreadDmCount((c) => c + 1);
          setPendingDmNotice(msg);
        }
      } catch (e) {}
    });

    socket.on('chatMessage', (msg) => {
      setRoomState((prev) => {
        if (!prev) return prev;
        const exists = prev.messages?.some((m) => m.id === msg.id);
        if (exists) return prev;
        return {
          ...prev,
          messages: [...(prev.messages || []), msg]
        };
      });

      setMobileTab(curr => {
        if (curr !== 'chat') {
          setUnreadChatCount(c => c + 1);
        }
        return curr;
      });
    });

    socket.on('chatMessageEdited', ({ id, text, isEdited }) => {
      setRoomState((prev) => {
        if (!prev || !prev.messages) return prev;
        return {
          ...prev,
          messages: prev.messages.map(m => m.id === id ? { ...m, text, isEdited: true } : m)
        };
      });
    });

    socket.on('chatMessageDeleted', ({ id }) => {
      setRoomState((prev) => {
        if (!prev || !prev.messages) return prev;
        return {
          ...prev,
          messages: prev.messages.filter(m => m.id !== id)
        };
      });
    });

    socket.on('messagesReadUpdate', ({ messageIds, reader, readByList }) => {
      setRoomState((prev) => {
        if (!prev || !prev.messages) return prev;
        return {
          ...prev,
          messages: prev.messages.map(m => {
            if (messageIds && messageIds.includes(m.id)) {
              if (readByList) {
                return { ...m, readBy: readByList };
              }
              const currentReadBy = m.readBy ? [...m.readBy] : [];
              if (reader && !currentReadBy.some(r => r.id === reader.id)) {
                currentReadBy.push(reader);
              }
              return { ...m, readBy: currentReadBy };
            }
            return m;
          })
        };
      });
    });

    socket.on('playerTyping', ({ senderId, senderName }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [senderId]: { name: senderName, expiresAt: Date.now() + 3000 }
      }));
    });

    // Мгновенное начисление BunCoins от администратора в реальном времени!
    socket.on('userProfileUpdated', (data) => {
      if (!data || !data.user) return;
      const mySaved = localStorage.getItem('bunker_user_v3');
      if (mySaved) {
        try {
          const parsed = JSON.parse(mySaved);
          if (parsed.username && parsed.username.toLowerCase() === data.user.username.toLowerCase()) {
            setUser(data.user);
            localStorage.setItem('bunker_user_v3', JSON.stringify(data.user));
            soundManager.playBeep(1200, 0.15);
          }
        } catch (e) {}
      }
    });

    socket.on('userBlocked', ({ username, message }) => {
      const mySaved = localStorage.getItem('bunker_user_v3');
      if (mySaved) {
        try {
          const parsed = JSON.parse(mySaved);
          if (parsed.username && parsed.username.toLowerCase() === (username || '').toLowerCase()) {
            alert(message || 'Ваш аккаунт заблокирован администратором!');
            handleLogout();
          }
        } catch (e) {}
      }
    });

    socket.on('roomClosedByAdmin', ({ message }) => {
      alert(message || 'Комната была принудительно закрыта администратором!');
      handleLeaveRoom();
    });

    socket.on('roomInvite', (invite) => {
      if (!invite || !invite.roomCode) return;
      const mySaved = localStorage.getItem('bunker_user_v3');
      if (!mySaved) return;
      try {
        const parsed = JSON.parse(mySaved);
        const matchName = parsed.username && invite.targetUsername && parsed.username.toLowerCase() === invite.targetUsername.toLowerCase();
        const matchId = parsed.userId && invite.targetUserId && String(parsed.userId) === String(invite.targetUserId);
        if (matchName || matchId) {
          soundManager.playBeep(1150, 0.14);
          setPendingInvite(invite);
        }
      } catch (e) {}
    });

    return () => {
      socket.off('connect');
      socket.off('publicRoomsUpdated');
      socket.off('roomStateUpdate');
      socket.off('directMessageReceived');
      socket.off('chatMessage');
      socket.off('userProfileUpdated');
      socket.off('userBlocked');
      socket.off('roomClosedByAdmin');
      socket.off('roomInvite');
      socket.off('messagesReadUpdate');
    };
  }, []);

  // Sync profile on mount and enforce mandatory rules if not accepted yet
  useEffect(() => {
    if (user?.username) {
      socket.emit('getProfile', { username: user.username, fallbackUser: user }, (res) => {
        if (res && res.user) {
          setUser(res.user);
          localStorage.setItem('bunker_user_v3', JSON.stringify(res.user));
          if (!res.user.rulesAccepted) {
            setIsRulesMandatory(true);
            setShowRulesModal(true);
          }
        }
      });
    }
  }, []);

  const handleAuthSuccess = (authedUser, isNewRegistration = false) => {
    setUser(authedUser);
    localStorage.setItem('bunker_user_v3', JSON.stringify(authedUser));
    setPlayerName(authedUser.username);
    localStorage.setItem('bunker_player_name', authedUser.username);
    setShowAuthModal(false);

    // If new registration or rules not accepted yet, show mandatory RulesModal
    if (isNewRegistration || !authedUser.rulesAccepted) {
      setIsRulesMandatory(true);
      setShowRulesModal(true);
    }
  };

  // Global Google Auth synchronization across tabs/popups
  useEffect(() => {
    let bc = null;
    try {
      bc = new BroadcastChannel('bunker_google_auth');
      bc.onmessage = (event) => {
        if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data.user) {
          handleAuthSuccess(event.data.user, false);
        }
      };
    } catch (e) {}

    const handleMessage = (event) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data.user) {
        handleAuthSuccess(event.data.user, false);
      }
    };
    window.addEventListener('message', handleMessage);

    const handleStorage = (e) => {
      if (e.key === 'bunker_user_v3' && e.newValue) {
        try {
          const u = JSON.parse(e.newValue);
          if (u && u.username) handleAuthSuccess(u, false);
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handleRulesUnderstood = () => {
    if (user?.username) {
      const updatedUser = { ...user, rulesAccepted: true };
      setUser(updatedUser);
      localStorage.setItem('bunker_user_v3', JSON.stringify(updatedUser));
      socket.emit('updateProfile', { username: user.username, rulesAccepted: true });
    }
    setIsRulesMandatory(false);
    setShowRulesModal(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('bunker_user_v3');
    localStorage.removeItem('bunker_user');
  };

  const handleUserUpdated = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('bunker_user_v3', JSON.stringify(updatedUser));
  };

  const handleSwitchMobileTab = (tab) => {
    setMobileTab(tab);
    if (tab === 'chat') {
      setUnreadChatCount(0);
    }
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!user) {
      setErrorMessage(lang === 'uz' ? '⚠️ Bunker yaratish uchun tizimga kiring yoki ro\'yxatdan o\'ting!' : lang === 'en' ? '⚠️ Registration or login required to create a bunker!' : '⚠️ Для создания бункера необходимо зарегистрироваться или войти в аккаунт!');
      setShowAuthModal(true);
      return;
    }

    const defaultCommander = lang === 'uz' ? 'Komandir' : lang === 'en' ? 'Commander' : 'Командир';
    const name = (user.username || playerName).trim() || defaultCommander;
    localStorage.setItem('bunker_player_name', name);
    soundManager.playBeep(800, 0.08);

    socket.emit('createRoom', { playerName: name, userProfile: user }, (res) => {
      if (res?.error) {
        setErrorMessage(res.error);
        return;
      }
      setMyPlayerId(res.playerId);
      localStorage.setItem('bunker_player_id', res.playerId);
      localStorage.setItem('bunker_room_code', res.code);
      applyNormalizedRoomState(res.room);
      setInRoom(true);
    });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!user) {
      setErrorMessage(lang === 'uz' ? '⚠️ Bunkerga ulanish uchun tizimga kiring yoki ro\'yxatdan o\'ting!' : lang === 'en' ? '⚠️ Registration or login required to join a bunker!' : '⚠️ Для подключения к бункеру необходимо зарегистрироваться или войти в аккаунт!');
      setShowAuthModal(true);
      return;
    }

    const defaultSurvivor = lang === 'uz' ? 'Omon qolgan' : lang === 'en' ? 'Survivor' : 'Выживший';
    const name = (user.username || playerName).trim() || defaultSurvivor;
    const code = joinCode.trim();

    if (!code) {
      setErrorMessage(lang === 'uz' ? 'Xona kodini kiriting.' : lang === 'en' ? 'Enter room code.' : 'Введите цифровой код комнаты.');
      return;
    }

    localStorage.setItem('bunker_player_name', name);
    soundManager.playBeep(700, 0.08);

    socket.emit('joinRoom', { roomCode: code, playerName: name, userProfile: user }, (res) => {
      if (res?.error) {
        setErrorMessage(res.error);
        return;
      }
      setMyPlayerId(res.playerId);
      localStorage.setItem('bunker_player_id', res.playerId);
      localStorage.setItem('bunker_room_code', res.code);
      applyNormalizedRoomState(res.room);
      setInRoom(true);
    });
  };

  const handleJoinRoomByCode = (targetCode) => {
    const clean = String(targetCode || '').trim();
    if (!clean) return;
    setErrorMessage('');

    if (!user) {
      setErrorMessage(
        lang === 'uz'
          ? "⚠️ Bunkerga ulanish uchun tizimga kiring yoki ro'yxatdan o'ting!"
          : lang === 'en'
          ? '⚠️ Registration or login required to join a bunker!'
          : '⚠️ Для входа в комнату необходимо зарегистрироваться или войти в аккаунт!'
      );
      setShowAuthModal(true);
      return;
    }

    // Если уже в другой комнате — сначала выходим из старой
    const currentCode = roomState?.code || localStorage.getItem('bunker_room_code');
    const currentPid = myPlayerId || localStorage.getItem('bunker_player_id');
    if (currentCode && currentCode !== clean) {
      socket.emit('leaveRoom', { roomCode: currentCode, playerId: currentPid });
    }

    const name = (user.username || playerName || 'Выживший').trim();
    localStorage.setItem('bunker_player_name', name);
    soundManager.playBeep(950, 0.08);
    setPendingInvite(null);

    socket.emit('joinRoom', { roomCode: clean, playerName: name, userProfile: user }, (res) => {
      if (res?.error) {
        setErrorMessage(res.error);
        return;
      }
      setMyPlayerId(res.playerId);
      localStorage.setItem('bunker_player_id', res.playerId);
      localStorage.setItem('bunker_room_code', res.code);
      applyNormalizedRoomState(res.room);
      setInRoom(true);
    });
  };

  const handleStartGame = () => {
    if (!roomState?.code) return;
    socket.emit('startGame', { roomCode: roomState.code, requesterId: myPlayerId }, (res) => {
      if (res?.error) {
        setErrorMessage(res.error);
      }
    });
  };

  const handleAddBot = () => {
    if (!roomState?.code) return;
    socket.emit('addBot', { roomCode: roomState.code, requesterId: myPlayerId, lang });
  };

  const handleRemoveBot = (botId) => {
    if (!roomState?.code) return;
    socket.emit('removeBot', { roomCode: roomState.code, botId, requesterId: myPlayerId });
  };

  const handleRevealCard = (cardId) => {
    if (!roomState?.code) return;
    socket.emit('revealCard', { roomCode: roomState.code, playerId: myPlayerId, cardId });
  };

  const handleStartVoting = () => {
    if (!roomState?.code) return;
    socket.emit('startVoting', { roomCode: roomState.code, requesterId: myPlayerId });
  };

  const handleCastVote = (targetPlayerId) => {
    if (!roomState?.code) return;
    socket.emit('castVote', { roomCode: roomState.code, voterId: myPlayerId, targetPlayerId });
  };

  const handleNextRound = () => {
    if (!roomState?.code) return;
    socket.emit('nextRound', { roomCode: roomState.code, requesterId: myPlayerId });
  };

  const handleRestartGame = () => {
    if (!roomState?.code) return;
    socket.emit('restartGame', { roomCode: roomState.code, requesterId: myPlayerId });
  };

  const handleSendMessage = (text, sticker = null, voice = null, replyTo = null) => {
    if (!roomState?.code) return;
    socket.emit('sendMessage', { roomCode: roomState.code, senderId: myPlayerId, text, sticker, voice, replyTo });
  };

  const handleEditMessage = (messageId, newText) => {
    if (!roomState?.code) return;
    socket.emit('editChatMessage', { roomCode: roomState.code, senderId: myPlayerId, messageId, newText });
  };

  const handleDeleteMessage = (messageId) => {
    if (!roomState?.code) return;
    socket.emit('deleteChatMessage', { roomCode: roomState.code, senderId: myPlayerId, messageId });
  };

  const handleTyping = () => {
    if (!roomState?.code) return;
    socket.emit('typing', { roomCode: roomState.code, senderId: myPlayerId, senderName: myPlayer?.name || playerName });
  };

  const handleMarkMessagesRead = (messageIds) => {
    if (!roomState?.code || !myPlayerId || !Array.isArray(messageIds) || messageIds.length === 0) return;
    socket.emit('markMessagesRead', {
      roomCode: roomState.code,
      playerId: myPlayerId,
      playerName: myPlayer?.name || playerName,
      messageIds
    });
  };

  const handleApplyTrump = (payload, callback) => {
    if (!roomState?.code) return;
    socket.emit('useTrumpAbility', {
      roomCode: roomState.code,
      playerId: myPlayerId,
      payload
    }, (res) => {
      if (typeof callback === 'function') callback(res);
    });
  };

  const renderInviteBanner = () => {
    return (
      <>
        {pendingInvite && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] w-[94vw] max-w-md bg-zinc-950/95 border-2 border-cyan-400 rounded-2xl p-4 shadow-[0_0_40px_rgba(6,182,212,0.45)] animate-bounce text-white">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-xl shrink-0">
                  {pendingInvite.fromAvatar || '🥷'}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                    {lang === 'uz' ? "DO'STDAN TAKLIF!" : lang === 'en' ? 'FRIEND ROOM INVITE!' : '📨 ПРИГЛАШЕНИЕ ОТ ДРУГА!'}
                  </div>
                  <div className="text-xs sm:text-sm font-display font-bold text-white truncate">
                    {pendingInvite.fromUsername} {lang === 'uz' ? `sizni #${pendingInvite.roomCode} xonasiga chaqiryapti!` : lang === 'en' ? `invites you to Bunker #${pendingInvite.roomCode}!` : `зовёт вас в Бункер #${pendingInvite.roomCode}!`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleJoinRoomByCode(pendingInvite.roomCode)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-display font-bold text-xs transition cursor-pointer shadow-lg"
                >
                  {lang === 'uz' ? 'Kirish' : lang === 'en' ? 'Join' : 'Войти'}
                </button>
                <button
                  onClick={() => setPendingInvite(null)}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 text-xs transition cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {pendingDmNotice && !showFriendsModal && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[69] w-[94vw] max-w-md bg-zinc-950/95 border-2 border-amber-400 rounded-2xl p-3.5 shadow-[0_0_35px_rgba(245,158,11,0.4)] animate-fadeIn text-white">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                  💬 Сообщение от друга {pendingDmNotice.from}:
                </div>
                <div className="text-xs font-mono text-zinc-100 truncate mt-0.5">
                  «{pendingDmNotice.text}»
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    setInitialChatFriend({ username: pendingDmNotice.from });
                    setPendingDmNotice(null);
                    setUnreadDmCount(0);
                    setShowFriendsModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-display font-bold text-xs transition cursor-pointer"
                >
                  Ответить
                </button>
                <button
                  onClick={() => setPendingDmNotice(null)}
                  className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 text-xs transition cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  // SECRET HIDDEN ADMIN ROUTE (Configured via .env, /admin is disabled)
  if (currentPath === SECRET_ADMIN_PATH) {
    return (
      <AdminPageView
        socket={socket}
        lang={lang}
        onBack={() => navigateTo('/')}
      />
    );
  }

  // EPIC BUNKER 404 NOT FOUND ROUTE FOR ANY UNKNOWN PATH
  if (
    currentPath && 
    currentPath !== '/' && 
    currentPath !== '/index.html' && 
    !currentPath.startsWith('/auth/google') && 
    !(typeof window !== 'undefined' && ((window.location.search && window.location.search.includes('code=')) || (window.location.hash && window.location.hash.includes('access_token'))))
  ) {
    return (
      <NotFoundView
        currentPath={currentPath}
        onBackHome={() => navigateTo('/')}
        lang={lang}
        setLang={handleSetLang}
      />
    );
  }

  // GOOGLE OAUTH CALLBACK POPUP HANDLER (ПРИНИМАЕТ КОД ИЛИ ТОКЕН ОТ GOOGLE И ЗАКРЫВАЕТ ОКНО)
  if (
    (currentPath && currentPath.startsWith('/auth/google')) ||
    (typeof window !== 'undefined' && ((window.location.search && window.location.search.includes('code=')) || (window.location.hash && window.location.hash.includes('access_token'))))
  ) {
    return (
      <GoogleAuthCallbackView 
        socket={socket} 
        onSuccess={(loggedUser) => {
          handleAuthSuccess(loggedUser, false);
          navigateTo('/');
        }} 
      />
    );
  }

  // MAIN WELCOME / JOIN SCREEN
  if (!inRoom) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 dark:bg-zinc-950 flex flex-col justify-between p-3 sm:p-6 text-slate-800 dark:text-zinc-100 transition-colors duration-200 relative overflow-hidden">
        {/* Apocalyptic Ambient Animations */}
        <AtmosphereEffects enabled={atmosphereEnabled} lang={lang} />

        <div className="max-w-4xl mx-auto w-full pt-2 sm:pt-6 relative z-10">
          {/* Top Bar with User Profile, Rules, Atmosphere, Shop, Theme Toggle & Language Selector */}
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4 sm:mb-6">
            {/* Left: User Auth / BunCoins Pill */}
            <div>
              {user ? (
                <div className="flex items-center space-x-2 bg-white dark:bg-zinc-900 border border-amber-500/40 rounded-2xl p-1.5 px-3 shadow-sm">
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="flex items-center space-x-2 cursor-pointer hover:opacity-85 transition text-left"
                    title={t.profileBtnTooltip || "Нажмите, чтобы настроить фото и профиль"}
                  >
                    {user.characterDetails?.avatarUrl ? (
                      <img 
                        src={user.characterDetails.avatarUrl} 
                        alt="Avatar" 
                        className="w-7 h-7 rounded-xl object-cover border border-amber-500/50" 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <span className="text-xl">{user.characterDetails?.avatar || '🥷'}</span>
                    )}
                    <div className="font-mono">
                      <div className="text-xs font-bold text-slate-800 dark:text-zinc-100 flex items-center space-x-1">
                        <span>{user.username}</span>
                        {user.userId && (
                          <span className="bg-cyan-500/20 text-cyan-500 dark:text-cyan-400 px-1.5 py-0.2 rounded text-[10px] font-bold">
                            ID: #{user.userId}
                          </span>
                        )}
                        <span className="bg-amber-500/20 text-amber-500 px-1.5 py-0.2 rounded text-[10px] font-bold">
                          🪙 {user.bunCoins}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {user.characterDetails?.title ? getLocalized(user.characterDetails.title, lang) : (t.profilePhotoDefault || 'Фото профиля')}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={handleLogout}
                    title={t.authLogout}
                    className="text-zinc-400 hover:text-red-400 text-xs font-mono ml-1 px-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-mono font-bold text-xs uppercase shadow transition flex items-center space-x-1.5 cursor-pointer animate-pulse"
                >
                  <span>🔐</span>
                  <span>{t.btnAuth}</span>
                  <span className="bg-black/20 text-[10px] px-1.5 py-0.5 rounded text-amber-200">
                    +500 🪙
                  </span>
                </button>
              )}
            </div>

            {/* Right: Friends, Daily Crate / Promo, Rules, Atmosphere, Shop, Theme & Language */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* Daily Bonus Crate & Promo Code Button */}
              {user && (
                <button
                  onClick={() => setShowDailyModal(true)}
                  title={lang === 'uz' ? 'Kunlik quti va Promokod' : lang === 'en' ? 'Daily Supply Crate & Promo Code' : 'Ежедневный ящик снабжения и Промокоды'}
                  className="px-3 py-1.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500 hover:text-zinc-950 border border-amber-500/50 text-amber-600 dark:text-amber-300 font-mono font-bold text-xs transition shadow-sm flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>🎁</span>
                  <span>{lang === 'uz' ? 'Bonus / Kod' : lang === 'en' ? 'Bonus / Promo' : 'Ящик / Промокод'}</span>
                </button>
              )}

              {/* Friends by ID Button */}
              {user && (
                <button
                  onClick={() => {
                    setInitialChatFriend(null);
                    setUnreadDmCount(0);
                    setPendingDmNotice(null);
                    setShowFriendsModal(true);
                  }}
                  title={lang === 'uz' ? "Do'stlar (ID orqali)" : lang === 'en' ? 'Friends (by ID)' : 'Добавить друзей по ID и играть вместе'}
                  className="px-3 py-1.5 rounded-2xl bg-cyan-500/15 hover:bg-cyan-500 hover:text-zinc-950 border border-cyan-500/40 text-cyan-600 dark:text-cyan-300 font-mono font-bold text-xs transition shadow-sm flex items-center space-x-1.5 cursor-pointer relative"
                >
                  <span>👥</span>
                  <span>{lang === 'uz' ? "Do'stlar" : lang === 'en' ? 'Friends' : 'Друзья'}</span>
                  {user.userId && (
                    <span className="hidden sm:inline text-[10px] opacity-80">#{user.userId}</span>
                  )}
                  {unreadDmCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[9px] font-bold animate-bounce">
                      💬 {unreadDmCount}
                    </span>
                  )}
                </button>
              )}

              {/* Install PWA / Download Android APK Button (Automatically hidden once installed!) */}
              {!isAppInstalled && (
                <button
                  onClick={handleInstallApp}
                  title={lang === 'uz' ? "Android APK ilovasini yuklab olish" : lang === 'en' ? 'Download Android APK / Install App' : 'Скачать официальный Android APK и вывести на главный экран телефона'}
                  className="px-3 py-1.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500 hover:text-zinc-950 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs transition shadow-sm flex items-center space-x-1 cursor-pointer animate-pulse"
                >
                  <span>📲</span>
                  <span>{lang === 'uz' ? "APK Yuklash" : lang === 'en' ? 'Get APK' : 'Скачать APK'}</span>
                </button>
              )}

              {/* Rules Button */}
              <button
                onClick={() => {
                  setIsRulesMandatory(false);
                  setShowRulesModal(true);
                }}
                title={t.btnRulesTooltip || "Правила и условия игры"}
                className="px-3 py-1.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-zinc-950 font-mono font-bold text-xs transition shadow-sm flex items-center space-x-1 cursor-pointer"
              >
                <span>📜</span>
                <span className="hidden sm:inline">{t.btnRules || "Правила"}</span>
              </button>

              {/* Atmosphere Toggle */}
              <button
                onClick={() => handleToggleAtmosphere(!atmosphereEnabled)}
                title={atmosphereEnabled ? (t.atmosphereOffTooltip || "Отключить эффекты") : (t.atmosphereOnTooltip || "Включить эффекты")}
                className={`px-2.5 py-1.5 rounded-2xl border text-xs font-mono font-bold transition shadow-sm flex items-center space-x-1 cursor-pointer ${
                  atmosphereEnabled
                    ? 'bg-amber-500/20 text-amber-500 border-amber-500/50'
                    : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500'
                }`}
              >
                <span>☢️</span>
                <span className="hidden md:inline text-[10px]">{t.btnEffects || "Эффекты"}</span>
              </button>

              {/* Shop Button */}
              <button
                onClick={() => setShowShopModal(true)}
                title={t.shopBtn}
                className="px-3 py-1.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-zinc-950 font-mono font-bold text-xs transition shadow-sm flex items-center space-x-1 cursor-pointer"
              >
                <span>🛒</span>
                <span className="hidden sm:inline">{t.shopBtn}</span>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                title={theme === 'dark' ? t.lightThemeTooltip : t.darkThemeTooltip}
                className="p-2 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-amber-500 shadow-sm transition cursor-pointer"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
              </button>

              {/* Language Selector */}
              <div className="flex items-center bg-white dark:bg-zinc-900 rounded-2xl p-1 border border-slate-200 dark:border-zinc-800 text-xs font-mono font-bold shadow-sm">
                <button
                  onClick={() => handleSetLang('ru')}
                  className={`px-2.5 py-1 rounded-xl transition cursor-pointer ${
                    lang === 'ru' ? 'bg-amber-500 text-black shadow-sm' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  RU
                </button>
                <button
                  onClick={() => handleSetLang('en')}
                  className={`px-2.5 py-1 rounded-xl transition cursor-pointer ${
                    lang === 'en' ? 'bg-amber-500 text-black shadow-sm' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => handleSetLang('uz')}
                  className={`px-2.5 py-1 rounded-xl transition cursor-pointer ${
                    lang === 'uz' ? 'bg-amber-500 text-black shadow-sm' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  UZ
                </button>
              </div>
            </div>
          </div>

          {/* Hero Header with Animated BunkerLogo */}
          <div className="text-center space-y-3 mb-6 sm:mb-10">
            <BunkerLogo size="hero" className="mx-auto" lang={lang} />

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider">
                <Radio className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                {t.heroBadgeText || 'ОНЛАЙН-ИГРА • 3-12 ИГРОКОВ • 2-5 ПРИЗОВЫХ МЕСТ'}
              </div>

              <button
                onClick={() => {
                  setIsRulesMandatory(false);
                  setShowRulesModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-amber-400 border border-zinc-700 font-mono text-[11px] sm:text-xs font-bold transition shadow cursor-pointer"
              >
                <span>📜</span>
                <span>{t.howToPlayBtn || 'Как играть? (Правила)'}</span>
              </button>
            </div>

            <p className="text-xs sm:text-base text-slate-500 dark:text-zinc-400 max-w-lg mx-auto font-mono">
              {t.subtitle}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 sm:mb-6 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/60 border-2 border-red-500 text-red-700 dark:text-red-300 text-xs sm:text-sm font-mono flex items-center gap-2.5 max-w-md mx-auto shadow-lg">
              <AlertOctagon className="w-5 h-5 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Cards: Create / Join */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
            {/* Create Room */}
            <div className="bg-white dark:bg-zinc-900 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-7 flex flex-col justify-between shadow-xl hover:border-amber-500 transition-all">
              <div className="space-y-3 sm:space-y-4">
                <div className="p-2.5 sm:p-3 w-fit rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/30">
                  <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-display font-bold text-slate-900 dark:text-white tracking-wide">
                    {t.createRoom}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                    {t.createRoomDesc}
                  </p>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-mono font-bold text-slate-600 dark:text-zinc-400 uppercase">
                    {t.yourName}
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    maxLength={20}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 sm:py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <button
                onClick={handleCreateRoom}
                className="mt-5 sm:mt-6 w-full py-3 sm:py-3.5 rounded-2xl font-display font-bold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 transition cursor-pointer"
              >
                <Terminal className="w-4 h-4" />
                {t.btnCreate}
              </button>
            </div>

            {/* Join Room */}
            <div className="bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-700 rounded-3xl p-5 sm:p-7 flex flex-col justify-between shadow-xl hover:border-slate-300 dark:hover:border-zinc-500 transition-all">
              <div className="space-y-3 sm:space-y-4">
                <div className="p-2.5 sm:p-3 w-fit rounded-2xl bg-slate-100 dark:bg-zinc-800 text-cyan-600 dark:text-cyan-400 border border-slate-200 dark:border-cyan-800/40">
                  <LogIn className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-display font-bold text-slate-900 dark:text-white tracking-wide">
                    {t.joinRoom}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                    {t.joinRoomDesc}
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div>
                    <label className="text-xs font-mono font-bold text-slate-600 dark:text-zinc-400 uppercase">
                      {t.yourName}
                    </label>
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder={t.namePlaceholder}
                      maxLength={20}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 sm:py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-mono font-bold text-slate-600 dark:text-zinc-400 uppercase">
                      {t.roomCode}
                    </label>
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').substring(0, 5))}
                      placeholder={t.codePlaceholder}
                      maxLength={5}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 sm:py-3 text-base tracking-widest text-center text-cyan-600 dark:text-cyan-400 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:border-cyan-500 font-display font-bold"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleJoinRoom}
                className="mt-5 sm:mt-6 w-full py-3 sm:py-3.5 rounded-2xl font-display font-bold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition cursor-pointer"
              >
                <Users className="w-4 h-4" />
                {t.btnJoin}
              </button>
            </div>
          </div>

          {/* Public Open Rooms Browser (Список открытых комнат на главной странице — ТОЛЬКО до начала игры!) */}
          {(() => {
            const openLobbyRooms = publicRooms.filter(
              (rm) => rm.status === 'LOBBY' && (rm.playersCount ?? rm.totalPlayers ?? 0) < (rm.maxPlayers || 12)
            );
            return (
              <div className="mt-6 sm:mt-8 p-4 sm:p-5 rounded-3xl bg-white dark:bg-zinc-900/90 border-2 border-cyan-500/40 max-w-3xl mx-auto shadow-lg">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <h3 className="text-xs sm:text-sm font-display font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      {lang === 'uz'
                        ? `OCHIQ XONALAR RO'YXATI (${openLobbyRooms.length})`
                        : lang === 'en'
                        ? `OPEN PUBLIC LOBBIES (${openLobbyRooms.length})`
                        : `🌐 СПИСОК ОТКРЫТЫХ КОМНАТ (${openLobbyRooms.length})`}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      socket.emit('getPublicRooms', {}, (res) => {
                        if (res && res.success) setPublicRooms(res.rooms || []);
                      });
                    }}
                    className="text-[11px] font-mono text-cyan-500 hover:underline cursor-pointer"
                  >
                    {lang === 'uz' ? '↻ Yangilash' : lang === 'en' ? '↻ Refresh' : '↻ Обновить'}
                  </button>
                </div>

                {openLobbyRooms.length === 0 ? (
                  <div className="text-center py-4 px-3 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 text-xs font-mono text-slate-500 dark:text-zinc-400">
                    {lang === 'uz'
                      ? "Hozircha ochiq lobbilar yo'q (o'yin boshlangan xonalarga kirib bo'lmaydi). «Yangi xona yaratish» tugmasini bosing!"
                      : lang === 'en'
                      ? 'No open lobby rooms right now (rooms already in-game are locked). Click "Create Room" above!'
                      : 'Сейчас нет открытых лобби (в комнаты, где игра уже началась, вход закрыт). Нажмите «Создать бункер» выше!'}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {openLobbyRooms.map((rm) => {
                      const count = rm.playersCount ?? rm.totalPlayers ?? 1;
                      const maxP = rm.maxPlayers || 12;
                      return (
                        <div
                          key={rm.code}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 hover:border-cyan-500/50 transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-lg shrink-0">
                              {rm.hostAvatar || '🥷'}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-display font-bold text-slate-900 dark:text-white truncate">
                                {lang === 'uz'
                                  ? `Xona ${rm.hostName} (#${rm.code})`
                                  : lang === 'en'
                                  ? `Room ${rm.hostName} (#${rm.code})`
                                  : `Комната ${rm.hostName} (#${rm.code})`}
                              </div>
                              <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 flex items-center gap-2">
                                <span className="text-emerald-500 font-bold">
                                  👥 {count}/{maxP} {lang === 'uz' ? "o'yinchi" : lang === 'en' ? 'players' : 'игроков'}
                                </span>
                                <span>•</span>
                                <span className="text-amber-500">
                                  {lang === 'uz' ? 'Boshlanishidan oldin (Lobbi)' : lang === 'en' ? 'Waiting in Lobby' : 'До начала игры (Лобби)'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleJoinRoomByCode(rm.code)}
                            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-display font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-md shadow-cyan-500/20"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>{lang === 'uz' ? 'Kirish' : lang === 'en' ? 'Join' : 'Войти'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Rules Summary */}
          <div className="mt-6 sm:mt-8 p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 max-w-3xl mx-auto text-xs text-slate-600 dark:text-zinc-400 font-mono space-y-1.5 shadow-sm">
            <div className="text-slate-900 dark:text-zinc-200 font-bold flex items-center justify-between uppercase">
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-500" />
                {t.rulesTitle}
              </span>
              <button
                onClick={() => {
                  setIsRulesMandatory(false);
                  setShowRulesModal(true);
                }}
                className="text-amber-500 hover:underline text-xs lowercase cursor-pointer"
              >
                {t.fullRulesLink || 'полные правила →'}
              </button>
            </div>
            <p>{t.rule1}</p>
            <p>{t.rule2}</p>
            <p>{t.rule3}</p>
            <p>{t.rule4}</p>
          </div>
        </div>

        <footer className="text-center py-3 text-[10px] sm:text-[11px] text-slate-400 dark:text-zinc-600 font-mono relative z-10">
          {t.footerInfoText || 'БУНКЕР: 7 РАУНДОВ • МУЛЬТИПЛЕЕР 3-12 ЧЕЛОВЕК • 2-5 МЕСТ В БУНКЕРЕ'}
        </footer>

        {/* Auth Modal (Automatically shown as mandatory when !user) */}
        {(showAuthModal || !user) && (
          <AuthModal
            socket={socket}
            lang={lang}
            setLang={handleSetLang}
            isMandatory={!user}
            defaultTab="register"
            onClose={() => setShowAuthModal(false)}
            onAuthSuccess={handleAuthSuccess}
          />
        )}

        {/* Shop Modal */}
        {showShopModal && (
          <ShopModal
            socket={socket}
            lang={lang}
            user={user}
            onClose={() => setShowShopModal(false)}
            onUserUpdated={handleUserUpdated}
          />
        )}

        {/* Profile / Photo Modal */}
        {showProfileModal && (
          <ProfileModal
            user={user}
            socket={socket}
            lang={lang}
            onClose={() => setShowProfileModal(false)}
            onProfileUpdated={handleUserUpdated}
          />
        )}

        {/* Rules & Conditions Modal */}
        <RulesModal
          isOpen={showRulesModal}
          isMandatory={isRulesMandatory}
          onUnderstand={handleRulesUnderstood}
          onClose={() => setShowRulesModal(false)}
          lang={lang}
          setLang={handleSetLang}
        />

        {/* Install App & APK Modal */}
        {showInstallModal && (
          <InstallAppModal
            deferredPrompt={deferredInstallPrompt}
            onInstalled={() => {
              setIsAppInstalled(true);
              localStorage.setItem('bunker_app_installed', 'true');
            }}
            onClose={() => setShowInstallModal(false)}
            lang={lang}
          />
        )}

        {/* Daily Supply Crate & Promo Codes Modal */}
        {showDailyModal && user && (
          <DailyCrateModal
            user={user}
            socket={socket}
            lang={lang}
            onClose={() => setShowDailyModal(false)}
            onUserUpdated={handleUserUpdated}
          />
        )}

        {/* Friends by ID Modal */}
        {showFriendsModal && user && (
          <FriendsModal
            user={user}
            socket={socket}
            currentRoomCode={roomState?.code || null}
            initialChatFriend={initialChatFriend}
            onJoinFriendRoom={handleJoinRoomByCode}
            onClose={() => {
              setShowFriendsModal(false);
              setInitialChatFriend(null);
            }}
            onUserUpdated={handleUserUpdated}
            lang={lang}
          />
        )}

        {renderInviteBanner()}
      </div>
    );
  }

  // GAME OVER VIEW
  if (roomState?.status === 'GAME_OVER') {
    return (
      <div className="min-h-[100dvh] bg-slate-50 dark:bg-zinc-950 p-3 sm:p-6 text-slate-800 dark:text-zinc-100 flex flex-col justify-between transition-colors duration-200 relative overflow-hidden">
        <AtmosphereEffects enabled={atmosphereEnabled} lang={lang} />
        {renderInviteBanner()}

        <HeaderTerminal
          roomState={roomState}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          lang={lang}
          setLang={handleSetLang}
          theme={theme}
          setTheme={setTheme}
          user={user}
          onOpenAuth={() => setShowAuthModal(true)}
          onOpenShop={() => setShowShopModal(true)}
          onOpenProfile={() => setShowProfileModal(true)}
          onOpenRules={() => { setIsRulesMandatory(false); setShowRulesModal(true); }}
          onOpenFriends={() => setShowFriendsModal(true)}
          onOpenVoiceChat={handleOpenVoiceChat}
          isVoiceConnected={isVoiceConnected}
          isVoiceMuted={isVoiceMuted}
          isVoiceSpeaking={isVoiceSpeaking}
          voicePeers={voicePeers}
          atmosphereEnabled={atmosphereEnabled}
          setAtmosphereEnabled={handleToggleAtmosphere}
          onLeaveRoom={handleLeaveRoom}
          onLogout={handleLogout}
        />
        <main className="flex-1 max-w-6xl mx-auto w-full py-4 sm:py-6 relative z-10">
          <GameOverView
            roomState={roomState}
            myPlayerId={myPlayerId}
            onRestart={handleRestartGame}
            onLeaveGame={handleLeaveRoom}
            lang={lang}
          />
        </main>

        {showShopModal && (
          <ShopModal socket={socket} lang={lang} user={user} onClose={() => setShowShopModal(false)} onUserUpdated={handleUserUpdated} />
        )}

        {showProfileModal && (
          <ProfileModal user={user} socket={socket} lang={lang} onClose={() => setShowProfileModal(false)} onProfileUpdated={handleUserUpdated} />
        )}

        {showFriendsModal && user && (
          <FriendsModal
            user={user}
            socket={socket}
            currentRoomCode={roomState?.code || null}
            initialChatFriend={initialChatFriend}
            onJoinFriendRoom={handleJoinRoomByCode}
            onClose={() => {
              setShowFriendsModal(false);
              setInitialChatFriend(null);
            }}
            onUserUpdated={handleUserUpdated}
            lang={lang}
          />
        )}

        <RulesModal
          isOpen={showRulesModal}
          isMandatory={isRulesMandatory}
          onUnderstand={handleRulesUnderstood}
          onClose={() => setShowRulesModal(false)}
          lang={lang}
          setLang={handleSetLang}
        />
      </div>
    );
  }

  // LOBBY VIEW (With Full Pre-Game Chat & Voice Messages)
  if (roomState?.status === 'LOBBY') {
    return (
      <div className="min-h-[100dvh] bg-slate-50 dark:bg-zinc-950 p-2.5 sm:p-6 pb-20 md:pb-6 text-slate-800 dark:text-zinc-100 flex flex-col justify-between transition-colors duration-200 relative overflow-hidden">
        <AtmosphereEffects enabled={atmosphereEnabled} lang={lang} />
        {renderInviteBanner()}

        <HeaderTerminal
          roomState={roomState}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          lang={lang}
          setLang={handleSetLang}
          theme={theme}
          setTheme={setTheme}
          user={user}
          onOpenAuth={() => setShowAuthModal(true)}
          onOpenShop={() => setShowShopModal(true)}
          onOpenProfile={() => setShowProfileModal(true)}
          onOpenRules={() => { setIsRulesMandatory(false); setShowRulesModal(true); }}
          onOpenFriends={() => setShowFriendsModal(true)}
          onOpenVoiceChat={handleOpenVoiceChat}
          isVoiceConnected={isVoiceConnected}
          isVoiceMuted={isVoiceMuted}
          isVoiceSpeaking={isVoiceSpeaking}
          voicePeers={voicePeers}
          atmosphereEnabled={atmosphereEnabled}
          setAtmosphereEnabled={handleToggleAtmosphere}
          onLeaveRoom={handleLeaveRoom}
          onLogout={handleLogout}
        />

        <main className="flex-1 max-w-7xl mx-auto w-full py-3 sm:py-6 relative z-10 grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-5">
          {/* Left Column: Lobby View (Players, Settings, Bots, Start) */}
          <div className={`md:col-span-7 lg:col-span-8 ${mobileTab === 'chat' ? 'hidden md:block' : 'block'}`}>
            <LobbyView
              roomState={roomState}
              myPlayerId={myPlayerId}
              onStartGame={handleStartGame}
              onAddBot={handleAddBot}
              onRemoveBot={handleRemoveBot}
              onLeaveLobby={handleLeaveRoom}
              onOpenFriends={() => setShowFriendsModal(true)}
              speakingPlayerIds={speakingPlayerIds}
              lang={lang}
            />
          </div>

          {/* Right Column: Pre-game Chat Panel with Voice Messages */}
          <div className={`md:col-span-5 lg:col-span-4 h-[calc(100dvh-180px)] md:h-[620px] lg:h-[680px] md:sticky md:top-20 ${mobileTab === 'bunker' ? 'hidden md:block' : 'block'}`}>
            <ChatPanel
              messages={roomState?.messages || []}
              myPlayerId={myPlayerId}
              isAlive={true}
              isChatLocked={false}
              onSendMessage={handleSendMessage}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              onTyping={handleTyping}
              typingUsers={typingUsers}
              onStartVoting={null}
              isHost={isHost}
              canStartVoting={false}
              onMarkMessagesRead={handleMarkMessagesRead}
              lang={lang}
            />
          </div>
        </main>

        {/* Sleek Mobile Bottom Navigation Bar in Lobby */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800/90 px-3 py-2 flex items-center justify-around shadow-2xl pb-safe">
          <button
            onClick={() => handleSwitchMobileTab('bunker')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-display font-bold flex flex-col items-center justify-center gap-0.5 transition ${
              mobileTab === 'bunker'
                ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{lang === 'uz' ? 'Lobbi' : lang === 'en' ? 'Lobby' : 'Лобби'} ({roomState?.players?.length || 0})</span>
          </button>

          <button
            onClick={() => handleSwitchMobileTab('chat')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-display font-bold flex flex-col items-center justify-center gap-0.5 transition relative ${
              mobileTab === 'chat'
                ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <div className="relative">
              <Radio className="w-4 h-4" />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-red-600 text-[9px] text-white flex items-center justify-center font-bold">
                  {unreadChatCount > 9 ? '9+' : unreadChatCount}
                </span>
              )}
            </div>
            <span>{t.mobileTabChat || 'ЧАТ'}</span>
          </button>
        </nav>

        {showShopModal && (
          <ShopModal socket={socket} lang={lang} user={user} onClose={() => setShowShopModal(false)} onUserUpdated={handleUserUpdated} />
        )}

        {showProfileModal && (
          <ProfileModal user={user} socket={socket} lang={lang} onClose={() => setShowProfileModal(false)} onProfileUpdated={handleUserUpdated} />
        )}

        {showFriendsModal && user && (
          <FriendsModal
            user={user}
            socket={socket}
            currentRoomCode={roomState?.code || null}
            initialChatFriend={initialChatFriend}
            onJoinFriendRoom={handleJoinRoomByCode}
            onClose={() => {
              setShowFriendsModal(false);
              setInitialChatFriend(null);
            }}
            onUserUpdated={handleUserUpdated}
            lang={lang}
          />
        )}

        <RulesModal
          isOpen={showRulesModal}
          isMandatory={isRulesMandatory}
          onUnderstand={handleRulesUnderstood}
          onClose={() => setShowRulesModal(false)}
          lang={lang}
          setLang={handleSetLang}
        />
      </div>
    );
  }

  // ACTIVE GAME PLAY (Full Tablet & Mobile Responsiveness)
  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-zinc-950 flex flex-col text-slate-800 dark:text-zinc-100 pb-20 md:pb-6 transition-colors duration-200 relative overflow-hidden">
      <AtmosphereEffects enabled={atmosphereEnabled} lang={lang} />
      {renderInviteBanner()}

      <HeaderTerminal 
        roomState={roomState} 
        isMuted={isMuted} 
        setIsMuted={setIsMuted} 
        lang={lang} 
        setLang={handleSetLang} 
        theme={theme} 
        setTheme={setTheme}
        user={user}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenShop={() => setShowShopModal(true)}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenRules={() => { setIsRulesMandatory(false); setShowRulesModal(true); }}
        onOpenFriends={() => setShowFriendsModal(true)}
        atmosphereEnabled={atmosphereEnabled}
        setAtmosphereEnabled={handleToggleAtmosphere}
        onLeaveRoom={handleLeaveRoom}
        onLogout={handleLogout}
        isAlive={isAlive}
      />

      {/* Main Grid: Tablet & Desktop side-by-side (md:grid-cols-12), Phone stacked with bottom tabs */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-2.5 sm:p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-5 relative z-10">
        
        {/* Left Side: Players Grid */}
        <div className={`md:col-span-7 lg:col-span-8 space-y-3 sm:space-y-4 ${
          mobileTab === 'chat' ? 'hidden md:block' : 'block'
        }`}>
          {/* 👻 GHOST VISION HUD IF ELIMINATED */}
          {!isAlive && (
            <GhostVisionHUD
              ghostVotes={roomState?.ghostVotes}
              onLeaveRoom={handleLeaveRoom}
              lang={lang}
            />
          )}

          {/* Stage Banner */}
          <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[10px] sm:text-[11px] font-mono text-amber-600 dark:text-amber-500 uppercase font-bold">
                {t.round} {roomState?.currentRound} / {roomState?.maxRounds} • {t.bunkerCapacity} {roomState?.bunkerCapacity || 2}
              </div>
              <div className="text-sm sm:text-base md:text-lg font-display font-bold text-slate-900 dark:text-white mt-0.5">
                {roomState?.status === 'ROUND_REVEAL' && (
                  <span>
                    {t.turnLabel} <strong className="text-amber-500">{roomState.players?.find(p => p.id === roomState.activeTurnPlayerId)?.name || '...'}</strong> {t.turnDuration}
                  </span>
                )}
                {roomState?.status === 'ROUND_DISCUSSION' && `${t.stageDiscussion} ${t.timer20m}`}
                {roomState?.status === 'ROUND_VOTING' && t.stageVoting}
                {roomState?.status === 'ROUND_RESULT' && t.stageResult}
              </div>
            </div>

            {/* Quick Trigger Button for Card Reveal */}
            {roomState?.status === 'ROUND_REVEAL' && isAlive && !myPlayer?.hasRevealedThisRound && (
              <button
                onClick={() => {
                  soundManager.playBeep(750, 0.05);
                  setShowRevealModal(true);
                }}
                className="px-3 sm:px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-display font-bold shadow-md shadow-amber-500/20 animate-bounce cursor-pointer shrink-0"
              >
                {t.btnChooseCard}
              </button>
            )}
          </div>

          {/* Players Grid: 1 col on mobile, 2 cols on tablet/desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {roomState?.players?.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                isSelf={player.id === myPlayerId}
                isVoting={(roomState.status === 'ROUND_VOTING' || roomState.status === 'ROUND_DISCUSSION') && isAlive}
                onVoteTarget={handleCastVote}
                hasVotedForThis={myPlayer?.votedFor === player.id}
                myHasVoted={Boolean(myPlayer?.hasVoted)}
                onInspectCard={(data) => setInspectCardData(data)}
                onUseTrump={(card) => setActiveTrumpCard(card)}
                isSpeaking={speakingPlayerIds.has(player.id)}
                lang={lang}
              />
            ))}
          </div>
        </div>

        {/* Right Side: Chat Panel */}
        <div className={`md:col-span-5 lg:col-span-4 h-[calc(100dvh-175px)] md:h-[620px] lg:h-[680px] md:sticky md:top-20 ${
          mobileTab === 'bunker' ? 'hidden md:block' : 'block'
        }`}>
          <ChatPanel
            messages={roomState?.messages || []}
            myPlayerId={myPlayerId}
            isAlive={isAlive}
            isChatLocked={isChatLocked}
            onSendMessage={handleSendMessage}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onTyping={handleTyping}
            typingUsers={typingUsers}
            onStartVoting={handleStartVoting}
            isHost={isHost}
            canStartVoting={roomState?.status === 'ROUND_DISCUSSION' || roomState?.status === 'ROUND_VOTING'}
            onMarkMessagesRead={handleMarkMessagesRead}
            lang={lang}
          />
        </div>
      </main>

      {/* Floating Action Button (FAB) on Mobile when it's time to reveal card */}
      {roomState?.status === 'ROUND_REVEAL' && isAlive && (!showRevealModal || !myPlayer?.hasRevealedThisRound) && (
        <div className="md:hidden fixed bottom-18 right-4 z-40 animate-bounce">
          <button
            onClick={() => {
              soundManager.playBeep(750, 0.05);
              setShowRevealModal(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-amber-500 text-black font-display font-bold text-xs shadow-2xl flex items-center gap-1.5 border-2 border-white/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t.btnChooseCard}</span>
          </button>
        </div>
      )}

      {/* Sleek Mobile Bottom Navigation Bar (Hidden on Tablets & Desktops) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800/90 px-3 py-2 flex items-center justify-around shadow-2xl pb-safe">
        <button
          onClick={() => handleSwitchMobileTab('bunker')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-display font-bold flex flex-col items-center justify-center gap-0.5 transition ${
            mobileTab === 'bunker'
              ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t.mobileTabBunker} ({roomState?.players?.length || 0})</span>
        </button>

        <button
          onClick={() => handleSwitchMobileTab('chat')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-display font-bold flex flex-col items-center justify-center gap-0.5 transition relative ${
            mobileTab === 'chat'
              ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <Radio className="w-4 h-4" />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-red-600 text-[9px] text-white flex items-center justify-center font-bold">
                {unreadChatCount > 9 ? '9+' : unreadChatCount}
              </span>
            )}
          </div>
          <span>{t.mobileTabChat}</span>
        </button>
      </nav>

      {/* MODALS */}
      {/* 1. Tactical Card Reveal Modal */}
      {roomState?.status === 'ROUND_REVEAL' && isAlive && showRevealModal && (
        <CardRevealModal
          myPlayer={myPlayer}
          currentRound={roomState.currentRound}
          onRevealCard={(cardId) => {
            handleRevealCard(cardId);
            if (cardId === 'special') {
              const spCard = myPlayer?.deck?.find(c => c.id === 'special' || c.type === 'special');
              if (spCard && !spCard.used) {
                setActiveTrumpCard(spCard);
              }
            }
          }}
          onUseTrump={(card) => setActiveTrumpCard(card)}
          onClose={() => setShowRevealModal(false)}
          expiresAt={roomState?.timerExpiresAt}
          activeTurnPlayer={roomState?.players?.find(p => p.id === roomState.activeTurnPlayerId)}
          isMyTurn={roomState?.activeTurnPlayerId === myPlayerId}
          lang={lang}
        />
      )}

      {/* 2. Secret Voting Modal (Available to ALL players during both ROUND_DISCUSSION and ROUND_VOTING) */}
      {(roomState?.status === 'ROUND_VOTING' || roomState?.status === 'ROUND_DISCUSSION') && showVotingModal && (
        <VotingModal
          roomState={roomState}
          myPlayerId={myPlayerId}
          onCastVote={handleCastVote}
          onUseTrump={(card) => setActiveTrumpCard(card)}
          onClose={() => setShowVotingModal(false)}
          onLeaveRoom={handleLeaveRoom}
          lang={lang}
        />
      )}

      {/* Floating Button when Discussion or Voting is Active so ANY player can open VotingModal anytime */}
      {(roomState?.status === 'ROUND_VOTING' || roomState?.status === 'ROUND_DISCUSSION') && !showVotingModal && (
        <div className="fixed bottom-16 md:bottom-6 left-1/2 -translate-x-1/2 z-40 animate-bounce">
          <button
            onClick={() => setShowVotingModal(true)}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-display font-extrabold text-sm shadow-[0_0_25px_rgba(239,68,68,0.5)] border-2 border-red-400 flex items-center gap-2 cursor-pointer"
          >
            <Vote className="w-4 h-4 fill-current" />
            <span>{t.btnOpenVoting || "🗳️ Открыть голосование"}</span>
          </button>
        </div>
      )}

      {/* 2.5 Among Us Ejection Cinematic Screen */}
      {roomState?.status === 'ROUND_RESULT' && showAmongUsEjection && (
        <AmongUsEjectionScreen
          exiledPlayer={roomState.votingResults?.exiledPlayer}
          roomState={roomState}
          onComplete={() => {
            setShowAmongUsEjection(false);
            setShowResultModal(true);
          }}
          lang={lang}
        />
      )}

      {/* 3. Round Result / Exile Modal (Minimizable to talk in chat) */}
      {roomState?.status === 'ROUND_RESULT' && !showAmongUsEjection && showResultModal && (
        <RoundResultModal
          roomState={roomState}
          myPlayerId={myPlayerId}
          onNextRound={handleNextRound}
          onClose={() => setShowResultModal(false)}
          onLeaveRoom={handleLeaveRoom}
          lang={lang}
        />
      )}

      {/* Floating Button when Result is Active but minimized */}
      {roomState?.status === 'ROUND_RESULT' && !showResultModal && (
        <div className="fixed bottom-16 md:bottom-6 left-1/2 -translate-x-1/2 z-40 animate-pulse">
          <button
            onClick={() => setShowResultModal(true)}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-display font-extrabold text-sm shadow-[0_0_25px_rgba(245,158,11,0.5)] border-2 border-amber-400 flex items-center gap-2 cursor-pointer"
          >
            <span>⚠️</span>
            <span>{lang === 'uz' ? "Raund natijalari (ko'rsatish)" : lang === 'en' ? "Round Results (Show)" : "Итоги раунда (Показать)"}</span>
          </button>
        </div>
      )}

      {/* 4. Full Card Detail Inspector Modal (Tap any card to view full text) */}
      {inspectCardData && (
        <CardDetailModal
          cardData={inspectCardData}
          onClose={() => setInspectCardData(null)}
          lang={lang}
        />
      )}

      {/* 5. Interactive Trump / Special Action Modal */}
      {activeTrumpCard && (
        <TrumpActionModal
          specialCard={activeTrumpCard}
          myDeck={myPlayer?.deck || []}
          otherPlayers={(roomState?.players || []).filter(p => p.id !== myPlayerId && p.isAlive)}
          onClose={() => setActiveTrumpCard(null)}
          onApplyTrump={handleApplyTrump}
          lang={lang}
        />
      )}

      {/* 6. User Auth Modal */}
      {showAuthModal && (
        <AuthModal
          socket={socket}
          lang={lang}
          setLang={handleSetLang}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {/* 7. Shop Modal */}
      {showShopModal && (
        <ShopModal
          socket={socket}
          lang={lang}
          user={user}
          onClose={() => setShowShopModal(false)}
          onUserUpdated={handleUserUpdated}
        />
      )}

      {/* 8. Profile / Photo Modal */}
      {showProfileModal && (
        <ProfileModal
          user={user}
          socket={socket}
          lang={lang}
          onClose={() => setShowProfileModal(false)}
          onProfileUpdated={handleUserUpdated}
        />
      )}

      {/* 9. Rules & Conditions Modal */}
      <RulesModal
        isOpen={showRulesModal}
        isMandatory={isRulesMandatory}
        onUnderstand={handleRulesUnderstood}
        onClose={() => setShowRulesModal(false)}
        lang={lang}
        setLang={handleSetLang}
      />

      {/* 10. Friends by ID Modal */}
      {showFriendsModal && user && (
        <FriendsModal
          user={user}
          socket={socket}
          currentRoomCode={roomState?.code || null}
          initialChatFriend={initialChatFriend}
          onJoinFriendRoom={handleJoinRoomByCode}
          onClose={() => {
            setShowFriendsModal(false);
            setInitialChatFriend(null);
          }}
          onUserUpdated={handleUserUpdated}
          lang={lang}
        />
      )}

      {/* 11. Live WebRTC Group Voice Chat Bar */}
      {roomState && (
        <VoiceChatBar
          voiceManager={voiceManagerRef.current}
          isConnected={isVoiceConnected}
          isMuted={isVoiceMuted}
          isSpeaking={isVoiceSpeaking}
          peers={voicePeers}
          myPlayerId={myPlayerId}
          lang={lang}
          onOpenModal={handleOpenVoiceChat}
          onToggleVoice={() => {
            if (isVoiceConnected) {
              voiceManagerRef.current?.leaveVoice();
              setIsVoiceConnected(false);
            } else {
              voiceManagerRef.current?.joinVoice(roomState.code, myPlayerId, myPlayer?.name || playerName)
                .then(() => setIsVoiceConnected(true))
                .catch(() => {
                  alert(t.voicePermissionError || (lang === 'uz' ? "Brauzerda mikrofonga ruxsat bering!" : lang === 'en' ? "Please allow microphone access in your browser!" : "Разрешите доступ к микрофону в браузере!"));
                });
            }
          }}
          onToggleMute={() => {
            const nextMuted = voiceManagerRef.current?.toggleMute();
            setIsVoiceMuted(Boolean(nextMuted));
          }}
        />
      )}

      {/* 12. Voice Chat Modal */}
      <VoiceChatModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        voiceManager={voiceManagerRef.current}
        isConnected={isVoiceConnected}
        isMuted={isVoiceMuted}
        isSpeaking={isVoiceSpeaking}
        peers={voicePeers}
        myPlayerId={myPlayerId}
        players={roomState?.players || []}
        lang={lang}
        onToggleVoice={() => {
          if (isVoiceConnected) {
            voiceManagerRef.current?.leaveVoice();
            setIsVoiceConnected(false);
          } else {
            voiceManagerRef.current?.joinVoice(roomState.code, myPlayerId, myPlayer?.name || playerName)
              .then(() => setIsVoiceConnected(true))
              .catch(() => {
                alert(t.voicePermissionError || (lang === 'uz' ? "Brauzerda mikrofonga ruxsat bering!" : lang === 'en' ? "Please allow microphone access in your browser!" : "Разрешите доступ к микрофону в браузере!"));
              });
          }
        }}
        onToggleMute={() => {
          const nextMuted = voiceManagerRef.current?.toggleMute();
          setIsVoiceMuted(Boolean(nextMuted));
        }}
      />
    </div>
  );
}
