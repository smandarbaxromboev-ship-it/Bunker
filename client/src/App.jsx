import React, { useState, useEffect } from 'react';
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

const BACKEND_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? undefined 
  : "https://bunker-ymqm.onrender.com";

const socket = io(BACKEND_URL);

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
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [isRulesMandatory, setIsRulesMandatory] = useState(false);
  const [showVotingModal, setShowVotingModal] = useState(true);
  const [showResultModal, setShowResultModal] = useState(true);
  const [atmosphereEnabled, setAtmosphereEnabled] = useState(() => {
    return localStorage.getItem('bunker_atmosphere') !== 'false';
  });

  const handleToggleAtmosphere = (val) => {
    setAtmosphereEnabled(val);
    localStorage.setItem('bunker_atmosphere', String(val));
  };

  // Auto-open voting and result modals on round phase change
  useEffect(() => {
    if (roomState?.status === 'ROUND_VOTING') {
      setShowVotingModal(true);
    } else if (roomState?.status === 'ROUND_RESULT') {
      setShowResultModal(true);
    }
  }, [roomState?.status]);

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
    socket.on('connect', () => {
      console.log('Подключено к серверу:', socket.id);
      const savedCode = localStorage.getItem('bunker_room_code');
      const savedId = localStorage.getItem('bunker_player_id');
      if (savedCode && savedId) {
        socket.emit('reconnectSession', { roomCode: savedCode, playerId: savedId }, (res) => {
          if (res && !res.error && res.room) {
            setRoomState(res.room);
            setMyPlayerId(res.playerId);
            setInRoom(true);
          }
        });
      }
    });

    socket.on('roomStateUpdate', (newState) => {
      const savedCode = localStorage.getItem('bunker_room_code');
      // Если игрок уже вышел в главное меню, игнорируем запаздывающие пакеты от старой комнаты
      if (!savedCode || (newState?.code && savedCode !== newState.code)) {
        return;
      }
      setRoomState(newState);
      setInRoom(true);
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

    return () => {
      socket.off('connect');
      socket.off('roomStateUpdate');
      socket.off('chatMessage');
      socket.off('userProfileUpdated');
      socket.off('userBlocked');
      socket.off('roomClosedByAdmin');
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
      setRoomState(res.room);
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
      setRoomState(res.room);
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

  const handleSendMessage = (text, sticker = null) => {
    if (!roomState?.code) return;
    socket.emit('sendMessage', { roomCode: roomState.code, senderId: myPlayerId, text, sticker });
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

  const myPlayer = roomState?.players?.find((p) => p.id === myPlayerId);
  const isAlive = myPlayer ? myPlayer.isAlive : true;
  const isHost = roomState?.hostId === myPlayerId;
  const isChatLocked = false; // Чат теперь доступен всегда, даже во время и после голосования!

  // DEDICATED /admin ROUTE
  if (currentPath === '/admin') {
    return (
      <AdminPageView
        socket={socket}
        lang={lang}
        onBack={() => navigateTo('/')}
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

            {/* Right: Rules, Atmosphere, Shop, Theme & Language */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
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
      </div>
    );
  }

  // GAME OVER VIEW
  if (roomState?.status === 'GAME_OVER') {
    return (
      <div className="min-h-[100dvh] bg-slate-50 dark:bg-zinc-950 p-3 sm:p-6 text-slate-800 dark:text-zinc-100 flex flex-col justify-between transition-colors duration-200 relative overflow-hidden">
        <AtmosphereEffects enabled={atmosphereEnabled} lang={lang} />

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

  // LOBBY VIEW
  if (roomState?.status === 'LOBBY') {
    return (
      <div className="min-h-[100dvh] bg-slate-50 dark:bg-zinc-950 p-3 sm:p-6 text-slate-800 dark:text-zinc-100 flex flex-col justify-between transition-colors duration-200 relative overflow-hidden">
        <AtmosphereEffects enabled={atmosphereEnabled} lang={lang} />

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
          atmosphereEnabled={atmosphereEnabled}
          setAtmosphereEnabled={handleToggleAtmosphere}
          onLeaveRoom={handleLeaveRoom}
          onLogout={handleLogout}
        />
        <main className="flex-1 max-w-6xl mx-auto w-full py-4 sm:py-6 relative z-10">
          <LobbyView
            roomState={roomState}
            myPlayerId={myPlayerId}
            onStartGame={handleStartGame}
            onAddBot={handleAddBot}
            onRemoveBot={handleRemoveBot}
            onLeaveLobby={handleLeaveRoom}
            lang={lang}
          />
        </main>

        {showShopModal && (
          <ShopModal socket={socket} lang={lang} user={user} onClose={() => setShowShopModal(false)} onUserUpdated={handleUserUpdated} />
        )}

        {showProfileModal && (
          <ProfileModal user={user} socket={socket} lang={lang} onClose={() => setShowProfileModal(false)} onProfileUpdated={handleUserUpdated} />
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
                onClick={() => soundManager.playBeep(750, 0.05)}
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
                isVoting={roomState.status === 'ROUND_VOTING'}
                onVoteTarget={handleCastVote}
                hasVotedForThis={myPlayer?.votedFor === player.id}
                onInspectCard={(data) => setInspectCardData(data)}
                onUseTrump={(card) => setActiveTrumpCard(card)}
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
            onStartVoting={handleStartVoting}
            isHost={isHost}
            canStartVoting={roomState?.status === 'ROUND_DISCUSSION'}
            lang={lang}
          />
        </div>
      </main>

      {/* Floating Action Button (FAB) on Mobile when it's time to reveal card */}
      {roomState?.status === 'ROUND_REVEAL' && isAlive && !myPlayer?.hasRevealedThisRound && (
        <div className="md:hidden fixed bottom-18 right-4 z-40 animate-bounce">
          <button
            onClick={() => soundManager.playBeep(750, 0.05)}
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
      {roomState?.status === 'ROUND_REVEAL' && isAlive && (
        <CardRevealModal
          myPlayer={myPlayer}
          currentRound={roomState.currentRound}
          onRevealCard={handleRevealCard}
          expiresAt={roomState?.timerExpiresAt}
          activeTurnPlayer={roomState?.players?.find(p => p.id === roomState.activeTurnPlayerId)}
          isMyTurn={roomState?.activeTurnPlayerId === myPlayerId}
          lang={lang}
        />
      )}

      {/* 2. Secret Voting Modal (Minimizable so players can chat and vote whenever they want) */}
      {roomState?.status === 'ROUND_VOTING' && showVotingModal && (
        <VotingModal
          roomState={roomState}
          myPlayerId={myPlayerId}
          onCastVote={handleCastVote}
          onClose={() => setShowVotingModal(false)}
          onLeaveRoom={handleLeaveRoom}
          lang={lang}
        />
      )}

      {/* Floating Button when Voting is Active but minimized */}
      {roomState?.status === 'ROUND_VOTING' && !showVotingModal && (
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

      {/* 3. Round Result / Exile Modal (Minimizable to talk in chat) */}
      {roomState?.status === 'ROUND_RESULT' && showResultModal && (
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
    </div>
  );
}
