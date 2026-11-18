import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Radio, Volume2, VolumeX, Flame,
  ChevronDown, ChevronUp, Sun, Moon,
  ShoppingBag, User, Users, Coins, LogOut, ArrowLeft,
  BookOpen, Sparkles, Mic, MicOff, Menu, X
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { translations, getLocalized } from '../utils/translations';
import CountdownTimer from './CountdownTimer';
import BunkerLogo from './BunkerLogo';

export default function HeaderTerminal({ 
  roomState, 
  isMuted, 
  setIsMuted, 
  lang, 
  setLang,
  theme,
  setTheme,
  user,
  onOpenAuth,
  onOpenShop,
  onOpenProfile,
  onOpenRules,
  onOpenFriends,
  onOpenVoiceChat,
  isVoiceConnected = false,
  isVoiceMuted = false,
  isVoiceSpeaking = false,
  isVoiceLoud = false,
  voicePeers = [],
  atmosphereEnabled = true,
  setAtmosphereEnabled,
  onLeaveRoom,
  onLogout,
  isAlive = true
}) {
  const [showDisaster, setShowDisaster] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[lang] || translations.ru;

  // Lock body scroll and handle Escape key when mobile menu is open
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundManager.enabled = !next;
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    soundManager.playBeep(850, 0.04);
  };

  const aliveCount = roomState?.players ? roomState.players.filter(p => p.isAlive).length : 0;

  return (
    <header className="border-b border-slate-200 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md sticky top-0 z-40 px-2 sm:px-3 py-1.5 transition-colors duration-200 shadow-sm relative w-full overflow-x-auto no-scrollbar">
      <div className="w-full flex items-center justify-between gap-1.5 flex-nowrap min-w-max">
        {/* Left: Brand & Room code & Back button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onLeaveRoom && (
            <button
              onClick={() => {
                soundManager.playBeep(600, 0.05);
                if (!isAlive || roomState?.status === 'GAME_OVER' || roomState?.status === 'LOBBY') {
                  onLeaveRoom();
                } else if (window.confirm(lang === 'uz' ? 'Bunkerdan chiqishni xohlaysizmi?' : lang === 'en' ? 'Leave bunker and return to menu?' : 'Вы действительно хотите выйти из бункера в главное меню?')) {
                  onLeaveRoom();
                }
              }}
              title={t.btnLeaveGame || t.btnBack}
              className="p-1 sm:px-2.5 sm:py-1 rounded-xl bg-slate-100 hover:bg-red-50 dark:bg-zinc-900 dark:hover:bg-red-950/60 text-slate-700 hover:text-red-600 dark:text-zinc-300 dark:hover:text-red-400 border border-slate-200 dark:border-zinc-800 text-xs font-mono font-bold transition flex items-center gap-1 shadow-sm cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{t.btnLeaveGame || t.btnBack}</span>
            </button>
          )}

          {!isAlive && roomState?.status !== 'GAME_OVER' && (
            <div
              title={lang === 'uz' ? 'Siz Arvoh rejimidasiz (istalgan vaqtda chiqishingiz mumkin)' : lang === 'en' ? 'You are in Ghost mode (you can leave anytime)' : 'Вы в режиме Призрака (можете наблюдать или выйти в любой момент)'}
              className="p-1 sm:px-2 sm:py-1 rounded-xl bg-purple-950/60 border border-purple-800/80 text-purple-300 text-xs font-mono font-bold flex items-center gap-1 shadow-sm shrink-0 select-none"
            >
              <span className="text-sm">👻</span>
              <span className="hidden sm:inline text-[11px]">{lang === 'uz' ? 'Arvoh' : lang === 'en' ? 'Ghost' : 'Призрак'}</span>
            </div>
          )}

          <BunkerLogo size="sm" lang={lang} hideTextOnMobile={true} compact={true} />
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-900 text-amber-600 dark:text-amber-400 font-mono font-bold border border-slate-300 dark:border-zinc-700 shrink-0">
              #{roomState?.code || '-----'}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 hidden lg:inline font-mono truncate">
              • {t.bunkerCapacity} <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{roomState?.bunkerCapacity || 2}</strong>
            </span>
          </div>
        </div>

        {/* Center: Live Round Status & Live Countdown Timer */}
        {roomState?.status && roomState.status !== 'LOBBY' && (
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-900/90 px-2 py-0.5 rounded-xl border border-slate-200 dark:border-zinc-800">
              <div className="text-center">
                <div className="text-[8px] uppercase text-slate-400 dark:text-zinc-500 font-bold font-mono">{t.round}</div>
                <div className="text-xs font-bold font-display text-amber-600 dark:text-amber-400">
                  {roomState.currentRound}<span className="text-slate-400 dark:text-zinc-600">/</span>{roomState.maxRounds}
                </div>
              </div>
              <div className="h-3.5 w-px bg-slate-200 dark:bg-zinc-800"></div>
              <div className="text-center">
                <div className="text-[8px] uppercase text-slate-400 dark:text-zinc-500 font-bold font-mono">{t.aliveSpots}</div>
                <div className="text-xs font-bold font-display text-emerald-600 dark:text-emerald-400">
                  {aliveCount}<span className="text-slate-400 dark:text-zinc-600">/</span>{roomState?.bunkerCapacity || 2}
                </div>
              </div>
            </div>

            {/* Live Countdown Timer */}
            <CountdownTimer 
              expiresAt={roomState.timerExpiresAt} 
              timerType={roomState.timerType} 
              lang={lang} 
            />
          </div>
        )}

        {/* Desktop Right Navigation: All Buttons in One Line (NO BURGER) */}
        <div className="hidden md:flex items-center gap-1 sm:gap-1.5 shrink-0 justify-end flex-nowrap">
          {/* 1. Voice Chat Button */}
          {roomState && onOpenVoiceChat && (
            <button
              onClick={() => {
                soundManager.playBeep(850, 0.05);
                onOpenVoiceChat();
              }}
              title={lang === 'uz' ? "Ovozli chat" : lang === 'en' ? "Voice Chat" : "Голосовой чат"}
              className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-xl border text-xs font-mono font-bold transition flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer shrink-0 ${
                isVoiceConnected
                  ? isVoiceSpeaking
                    ? 'bg-emerald-500 text-black border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.7)] animate-pulse'
                    : isVoiceMuted
                    ? 'bg-red-500/20 text-red-400 border-red-500/50'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                  : 'bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 hover:border-emerald-400'
              }`}
            >
              {isVoiceMuted ? (
                <MicOff className="w-3.5 h-3.5 text-red-400 shrink-0" />
              ) : (
                <Mic className={`w-3.5 h-3.5 shrink-0 ${isVoiceSpeaking ? (isVoiceLoud ? 'animate-mic-loud text-amber-300' : 'animate-mic-calm') : ''}`} />
              )}
              <span className="font-display font-bold text-xs">
                {lang === 'uz' ? 'Ovozli chat' : lang === 'en' ? 'Voice Chat' : 'Голосовой чат'}
              </span>
              {isVoiceConnected ? (
                <span className="text-[10px] px-1 py-0.2 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold shrink-0">
                  {(voicePeers?.length || 0) + 1}
                </span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
              )}
            </button>
          )}

          {/* 2. Friends Button */}
          {onOpenFriends && user && (
            <button
              onClick={() => {
                soundManager.playBeep(750, 0.05);
                onOpenFriends();
              }}
              title={lang === 'uz' ? "Do'stlar (ID orqali)" : lang === 'en' ? 'Friends (by ID)' : 'Друзья по ID'}
              className="px-2 py-1 sm:px-2.5 sm:py-1 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-600 dark:text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold transition flex items-center gap-1 shadow-sm cursor-pointer shrink-0"
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>{lang === 'uz' ? "Do'stlar" : lang === 'en' ? 'Friends' : 'Друзья'}</span>
            </button>
          )}

          {/* 3. Rules Button */}
          {onOpenRules && (
            <button
              onClick={() => {
                soundManager.playBeep(700, 0.05);
                onOpenRules();
              }}
              title={t.btnRulesTooltip || "Правила и условия игры"}
              className="px-2 py-1 sm:px-2.5 sm:py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-zinc-800 text-xs font-mono font-bold transition flex items-center gap-1 shadow-sm cursor-pointer shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>{t.btnRules || "Правила"}</span>
            </button>
          )}

          {/* 4. Atmosphere Button */}
          {setAtmosphereEnabled && (
            <button
              onClick={() => {
                soundManager.playBeep(750, 0.05);
                setAtmosphereEnabled(!atmosphereEnabled);
              }}
              title={atmosphereEnabled ? (t.atmosphereOffTooltip || "Отключить эффекты") : (t.atmosphereOnTooltip || "Включить эффекты")}
              className={`px-2 py-1 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer border shrink-0 ${
                atmosphereEnabled 
                  ? 'bg-amber-500/20 text-amber-500 dark:text-amber-400 border-amber-500/50 shadow-sm animate-pulse' 
                  : 'bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-zinc-500 border-slate-200 dark:border-zinc-800'
              }`}
            >
              <span>☢️</span>
              <span className="text-[10px] hidden sm:inline">{t.btnAtmosphere || "Атмосфера"}</span>
            </button>
          )}

          {/* 5. BunCoins & User Profile */}
          {user ? (
            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/40 rounded-xl px-2 py-0.5 shrink-0">
              <button
                onClick={onOpenProfile || onOpenShop}
                className="flex items-center space-x-1 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 hover:text-amber-300 transition cursor-pointer"
                title={t.profileBtnTooltip || "Нажмите, чтобы настроить фото профиля"}
              >
                {user.characterDetails?.avatarUrl ? (
                  <img 
                    src={user.characterDetails.avatarUrl} 
                    alt="Avatar" 
                    className="w-4 h-4 rounded-md object-cover border border-amber-500/50 shrink-0" 
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <span className="text-xs">{user.characterDetails?.avatar || '🥷'}</span>
                )}
                <span className="truncate max-w-[70px] sm:max-w-[90px]">{user.username}</span>
              </button>
              
              <button
                onClick={onOpenShop}
                className="bg-amber-500/20 px-1 py-0.2 rounded text-[10px] flex items-center space-x-0.5 text-amber-500 font-mono font-bold cursor-pointer hover:bg-amber-500/30 transition"
                title={t.shopBtn || "Магазин"}
              >
                <Coins className="w-3 h-3 text-amber-500 inline shrink-0" />
                <span>{(user.bunCoins || 0).toLocaleString()}</span>
              </button>

              <button
                onClick={onLogout}
                title={t.authLogout}
                className="text-slate-400 hover:text-red-400 p-0.5 transition cursor-pointer shrink-0"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-2.5 py-1 text-xs font-mono font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 transition shadow flex items-center space-x-1 cursor-pointer shrink-0"
            >
              <User className="w-3.5 h-3.5" />
              <span>{t.btnAuth}</span>
            </button>
          )}

          {/* 6. Shop Button */}
          <button
            onClick={onOpenShop}
            title={t.shopBtn}
            className="p-1 sm:p-1.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-zinc-950 transition shadow-sm cursor-pointer shrink-0"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
          </button>

          {/* 7. Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? t.lightThemeTooltip : t.darkThemeTooltip}
            className="p-1 sm:p-1.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-amber-500 transition cursor-pointer shrink-0"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
          </button>

          {/* 8. Language Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-zinc-900 rounded-xl p-0.5 border border-slate-200 dark:border-zinc-800 text-[10px] font-mono font-bold shrink-0">
            <button
              onClick={() => setLang('ru')}
              className={`px-1.5 py-0.5 rounded-lg transition cursor-pointer ${
                lang === 'ru' ? 'bg-amber-500 text-black shadow-sm font-bold' : 'text-slate-600 dark:text-zinc-400 hover:text-white'
              }`}
            >
              RU
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-1.5 py-0.5 rounded-lg transition cursor-pointer ${
                lang === 'en' ? 'bg-amber-500 text-black shadow-sm font-bold' : 'text-slate-600 dark:text-zinc-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('uz')}
              className={`px-1.5 py-0.5 rounded-lg transition cursor-pointer ${
                lang === 'uz' ? 'bg-amber-500 text-black shadow-sm font-bold' : 'text-slate-600 dark:text-zinc-400 hover:text-white'
              }`}
            >
              UZ
            </button>
          </div>

          {/* 9. Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-1 sm:p-1.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-amber-500 transition cursor-pointer shrink-0"
            title={isMuted ? (lang === 'uz' ? "Ovozni yoqish" : lang === 'en' ? "Unmute sound" : "Включить звук") : (lang === 'uz' ? "Ovozni o'chirish" : lang === 'en' ? "Mute sound" : "Выключить звук")}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" /> : <Volume2 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />}
          </button>
        </div>

        {/* Mobile Right Navigation: Voice Chat + Burger Button (ONLY ON PHONES) */}
        <div className="flex md:hidden items-center gap-1.5 shrink-0">
          {/* Mobile Voice Chat Button */}
          {roomState && onOpenVoiceChat && (
            <button
              onClick={() => {
                soundManager.playBeep(850, 0.05);
                onOpenVoiceChat();
              }}
              title={lang === 'uz' ? "Ovozli chat" : lang === 'en' ? "Voice Chat" : "Голосовой чат"}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer shrink-0 ${
                isVoiceConnected
                  ? isVoiceSpeaking
                    ? 'bg-emerald-500 text-black border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.7)] animate-pulse'
                    : isVoiceMuted
                    ? 'bg-red-500/20 text-red-400 border-red-500/50'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                  : 'bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
              }`}
            >
              {isVoiceMuted ? (
                <MicOff className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <Mic className={`w-3.5 h-3.5 ${isVoiceSpeaking ? (isVoiceLoud ? 'animate-mic-loud text-amber-300' : 'animate-mic-calm') : ''}`} />
              )}
              <span className="font-display font-bold text-xs">
                {isVoiceConnected 
                  ? (isVoiceSpeaking 
                      ? (lang === 'uz' ? 'Gapirmoqda' : lang === 'en' ? 'Speaking' : 'Говорит') 
                      : isVoiceMuted 
                      ? (lang === 'uz' ? 'Ovozsiz' : lang === 'en' ? 'Muted' : 'Мут') 
                      : (lang === 'uz' ? 'Efirda' : lang === 'en' ? 'Live' : 'В эфире')) 
                  : (lang === 'uz' ? 'Ovoz' : lang === 'en' ? 'Voice' : 'Голос')}
              </span>
              {isVoiceConnected ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                  {(voicePeers?.length || 0) + 1}
                </span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              )}
            </button>
          )}

          {/* Mobile Hamburger Menu Toggle Button */}
          <button
            onClick={() => {
              soundManager.playBeep(700, 0.05);
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-amber-500 transition shadow-sm active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
            aria-label="Menu"
            title={lang === 'uz' ? "Menyu" : lang === 'en' ? "Menu" : "Меню"}
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-amber-500" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Burger Menu Portal (Mounted directly to document.body, NEVER behind textures!) */}
      {mobileMenuOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end font-sans select-none animate-fadeIn">
          {/* Full Screen Backdrop */}
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity cursor-pointer"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-out Drawer Panel */}
          <div className="relative w-[82%] max-w-xs h-full bg-slate-900/98 dark:bg-zinc-950/98 border-l border-slate-700/80 dark:border-zinc-800 p-4 shadow-2xl flex flex-col justify-between overflow-y-auto z-10 animate-slideLeft">
            <div className="space-y-4">
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 dark:border-zinc-800">
                <BunkerLogo size="sm" lang={lang} hideTextOnMobile={false} compact={true} />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Profile Card */}
              {user ? (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {user.characterDetails?.avatarUrl ? (
                      <img 
                        src={user.characterDetails.avatarUrl} 
                        alt="Avatar" 
                        className="w-10 h-10 rounded-xl object-cover border border-amber-500/50 shrink-0" 
                      />
                    ) : (
                      <span className="text-2xl">{user.characterDetails?.avatar || '🥷'}</span>
                    )}
                    <div className="min-w-0">
                      <div className="font-display font-bold text-sm text-white truncate">
                        {user.username}
                      </div>
                      <div className="text-xs font-mono text-amber-400 font-bold flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5" />
                        <span>{(user.bunCoins || 0).toLocaleString()} 🪙</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        if (onOpenProfile) onOpenProfile();
                      }}
                      className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>{lang === 'uz' ? 'Profil' : lang === 'en' ? 'Profile' : 'Профиль'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        if (onLogout) onLogout();
                      }}
                      className="px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/60 text-red-400 border border-red-800/60 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{lang === 'uz' ? 'Chiqish' : lang === 'en' ? 'Logout' : 'Выйти'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onOpenAuth) onOpenAuth();
                  }}
                  className="w-full p-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-display font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  <span>{t.btnAuth || (lang === 'uz' ? "Kirish / Ro'yxatdan o'tish" : lang === 'en' ? 'Login / Register' : 'Войти в аккаунт')}</span>
                </button>
              )}

              {/* Navigation Action Links */}
              <div className="space-y-1.5">
                {roomState && onOpenVoiceChat && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenVoiceChat();
                    }}
                    className="w-full p-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center justify-between transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-emerald-400" />
                      <span>{lang === 'uz' ? 'Ovozli chat' : lang === 'en' ? 'Voice Chat' : 'Голосовой чат'}</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {isVoiceConnected ? `${(voicePeers?.length || 0) + 1} ${lang === 'uz' ? 'efirda' : lang === 'en' ? 'live' : 'в эфире'}` : (lang === 'uz' ? 'Kirish' : lang === 'en' ? 'Join' : 'Открыть')}
                    </span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onOpenShop) onOpenShop();
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 text-xs font-mono font-bold flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-amber-400" />
                    <span>{t.shopBtn || (lang === 'uz' ? "Do'kon" : lang === 'en' ? 'Shop' : 'Магазин')}</span>
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold">
                    {lang === 'uz' ? '150+ buyumlar' : lang === 'en' ? '150+ items' : '150+ скинов'}
                  </span>
                </button>

                {onOpenFriends && user && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenFriends();
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-cyan-300 text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>{lang === 'uz' ? "Do'stlar (ID orqali)" : lang === 'en' ? 'Friends (by ID)' : 'Друзья по ID'}</span>
                  </button>
                )}

                {onOpenRules && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenRules();
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-amber-300 text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span>{t.btnRules || (lang === 'uz' ? 'Qoidalar' : lang === 'en' ? 'Rules' : 'Правила игры')}</span>
                  </button>
                )}
              </div>

              {/* Quick Settings: Theme, Atmosphere, Sounds */}
              <div className="pt-2 border-t border-slate-800 dark:border-zinc-800 space-y-2">
                <div className="text-[10px] font-mono uppercase text-slate-400 font-bold px-1">
                  {lang === 'uz' ? 'Sozlamalar' : lang === 'en' ? 'Settings' : 'Настройки'}:
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-xl bg-slate-800 border border-slate-700/60 text-xs font-mono font-bold text-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
                    <span>{theme === 'dark' ? (lang === 'uz' ? 'Yorug‘' : lang === 'en' ? 'Light' : 'Светлая') : (lang === 'uz' ? 'Qorong‘i' : lang === 'en' ? 'Dark' : 'Тёмная')}</span>
                  </button>

                  <button
                    onClick={toggleSound}
                    className="p-2 rounded-xl bg-slate-800 border border-slate-700/60 text-xs font-mono font-bold text-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{isMuted ? (lang === 'uz' ? 'Ovozsiz' : lang === 'en' ? 'Muted' : 'Без звука') : (lang === 'uz' ? 'Ovoz: Yoqiq' : lang === 'en' ? 'Sound: On' : 'Звук: Вкл')}</span>
                  </button>
                </div>

                {setAtmosphereEnabled && (
                  <button
                    onClick={() => {
                      soundManager.playBeep(750, 0.05);
                      setAtmosphereEnabled(!atmosphereEnabled);
                    }}
                    className={`w-full p-2 rounded-xl text-xs font-mono font-bold flex items-center justify-between border transition cursor-pointer ${
                      atmosphereEnabled
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700/60'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>☢️</span>
                      <span>{t.btnAtmosphere || (lang === 'uz' ? 'Atmosfera' : lang === 'en' ? 'Atmosphere' : 'Атмосфера бункера')}</span>
                    </span>
                    <span className="text-[10px]">{atmosphereEnabled ? (lang === 'uz' ? 'YONIQ' : lang === 'en' ? 'ON' : 'ВКЛ') : (lang === 'uz' ? 'O‘CHIQ' : lang === 'en' ? 'OFF' : 'ВЫКЛ')}</span>
                  </button>
                )}
              </div>

              {/* Language Selector */}
              <div className="pt-2 border-t border-slate-800 dark:border-zinc-800 space-y-1.5">
                <div className="text-[10px] font-mono uppercase text-slate-400 font-bold px-1">
                  {lang === 'uz' ? 'Til' : lang === 'en' ? 'Language' : 'Язык'}:
                </div>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
                  {['ru', 'uz', 'en'].map(l => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition cursor-pointer ${
                        lang === l ? 'bg-amber-500 text-black shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 text-center text-[10px] font-mono text-slate-500">
              Bunker Survival Online
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Disaster Banner */}
      {roomState?.disaster && (
        <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-zinc-900 text-xs">
          <div 
            onClick={() => setShowDisaster(!showDisaster)}
            className="flex items-center justify-between gap-1.5 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 cursor-pointer"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <strong className="text-amber-700 dark:text-amber-400 uppercase text-[10px] sm:text-xs shrink-0">
                {getLocalized(roomState.disaster.title, lang)}:
              </strong>
              <span className="truncate text-slate-600 dark:text-zinc-300 text-[11px] sm:text-xs">
                {getLocalized(roomState.disaster.desc, lang)}
              </span>
            </div>
            <button className="text-slate-400 dark:text-zinc-500 hover:text-amber-500 shrink-0 cursor-pointer">
              {showDisaster ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showDisaster && (
            <div className="mt-1 p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 text-[11px] text-slate-700 dark:text-zinc-300 leading-relaxed animate-fadeIn">
              {getLocalized(roomState.disaster.desc, lang)}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
