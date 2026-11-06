import React, { useState } from 'react';
import { 
  Radio, Volume2, VolumeX, Flame,
  ChevronDown, ChevronUp, Sun, Moon,
  ShoppingBag, Key, User, Coins, LogOut
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { translations, getLocalized } from '../utils/translations';
import CountdownTimer from './CountdownTimer';

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
  onOpenAdmin,
  onLogout
}) {
  const [showDisaster, setShowDisaster] = useState(false);
  const t = translations[lang] || translations.ru;

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
    <header className="border-b border-slate-200 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md sticky top-0 z-40 px-2.5 sm:px-6 py-2 transition-colors duration-200 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        {/* Left: Brand & Room code */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-slate-900 dark:text-white text-xs sm:text-base truncate">
                {t.title}
              </span>
              <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-900 text-amber-600 dark:text-amber-400 font-mono font-bold border border-slate-300 dark:border-zinc-700 shrink-0">
                #{roomState?.code || '-----'}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-zinc-400 flex items-center gap-1 font-mono truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="truncate">{t.bunkerCapacity} <strong className="text-emerald-600 dark:text-emerald-400 font-bold">2</strong></span>
            </div>
          </div>
        </div>

        {/* Center: Live Round Status & Live Countdown Timer */}
        {roomState?.status && roomState.status !== 'LOBBY' && (
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 bg-slate-100 dark:bg-zinc-900/90 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-zinc-800">
              <div className="text-center">
                <div className="text-[9px] uppercase text-slate-400 dark:text-zinc-500 font-bold font-mono">{t.round}</div>
                <div className="text-xs sm:text-sm font-bold font-display text-amber-600 dark:text-amber-400">
                  {roomState.currentRound}<span className="text-slate-400 dark:text-zinc-600">/</span>{roomState.maxRounds}
                </div>
              </div>
              <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800"></div>
              <div className="text-center">
                <div className="text-[9px] uppercase text-slate-400 dark:text-zinc-500 font-bold font-mono">{t.aliveSpots}</div>
                <div className="text-xs sm:text-sm font-bold font-display text-emerald-600 dark:text-emerald-400">
                  {aliveCount}<span className="text-slate-400 dark:text-zinc-600">/</span>2
                </div>
              </div>
            </div>

            {/* Live Countdown Timer (includes 5-minute EXTRA_TIME indicator) */}
            <CountdownTimer 
              expiresAt={roomState.timerExpiresAt} 
              timerType={roomState.timerType} 
              lang={lang}
            />
          </div>
        )}

        {/* Right: BunCoins, Shop, Admin, Theme, Lang, Sound */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          {/* BunCoins Balance & Profile / Auth */}
          {user ? (
            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/40 rounded-xl px-2 py-1">
              <button
                onClick={onOpenShop}
                className="flex items-center space-x-1 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 hover:text-amber-300 transition"
                title={t.shopTitle}
              >
                <span>{user.characterDetails?.avatar || '🥷'}</span>
                <span className="hidden md:inline truncate max-w-[80px]">{user.username}</span>
                <span className="bg-amber-500/20 px-1.5 py-0.5 rounded text-[11px] flex items-center space-x-0.5">
                  <Coins className="w-3 h-3 text-amber-500 inline" />
                  <span>{user.bunCoins}</span>
                </span>
              </button>
              <button
                onClick={onLogout}
                title={t.authLogout}
                className="text-slate-400 hover:text-red-400 p-0.5 ml-1 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-2.5 py-1 text-xs font-mono font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 transition shadow flex items-center space-x-1"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.btnAuth}</span>
            </button>
          )}

          {/* Shop Button */}
          <button
            onClick={onOpenShop}
            title={t.shopBtn}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-zinc-950 transition shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>

          {/* Admin Panel Button */}
          <button
            onClick={onOpenAdmin}
            title="Админ панель (Samandar / 05052013)"
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-red-500 hover:bg-red-600 hover:text-white transition shadow-sm"
          >
            <Key className="w-4 h-4" />
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? t.lightThemeTooltip : t.darkThemeTooltip}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-amber-500 transition"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Language Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-zinc-900 rounded-xl p-0.5 border border-slate-200 dark:border-zinc-800 text-[11px] font-mono font-bold">
            <button
              onClick={() => setLang('ru')}
              className={`px-1.5 sm:px-2 py-1 rounded-lg transition ${
                lang === 'ru' ? 'bg-amber-500 text-black shadow-sm' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              RU
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-1.5 sm:px-2 py-1 rounded-lg transition ${
                lang === 'en' ? 'bg-amber-500 text-black shadow-sm' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('uz')}
              className={`px-1.5 sm:px-2 py-1 rounded-lg transition ${
                lang === 'uz' ? 'bg-amber-500 text-black shadow-sm' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              UZ
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-amber-500 transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400 dark:text-zinc-500" /> : <Volume2 className="w-4 h-4 text-amber-500 dark:text-amber-400" />}
          </button>
        </div>
      </div>

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
            <button className="text-slate-400 dark:text-zinc-500 hover:text-amber-500 shrink-0">
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
