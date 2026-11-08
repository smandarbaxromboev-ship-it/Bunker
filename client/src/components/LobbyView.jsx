import React, { useState } from 'react';
import { Users, Copy, Check, Play, Bot, AlertOctagon, Trophy, Trash2, UserMinus, ArrowLeft, AlertCircle } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { translations, getLocalized } from '../utils/translations';
import CharacterAvatar from './CharacterAvatar';

export default function LobbyView({ 
  roomState, 
  myPlayerId, 
  onStartGame, 
  onAddBot, 
  onRemoveBot, 
  onLeaveLobby,
  lang = 'ru' 
}) {
  const [copied, setCopied] = useState(false);
  const [startWarning, setStartWarning] = useState('');
  const t = translations[lang] || translations.ru;
  const isHost = roomState?.hostId === myPlayerId;
  const players = roomState?.players || [];
  const minPlayers = 3;
  const canStart = players.length >= minPlayers;
  const bots = players.filter(p => p.isBot);
  const currentSpots = roomState?.bunkerCapacity || (players.length >= 12 ? 5 : players.length === 11 ? 4 : players.length === 10 ? 3 : 2);
  const formattedRule = typeof t.importantRuleSpots === 'function'
    ? t.importantRuleSpots(currentSpots)
    : (t.importantRule || '').replace(/\{spots\}/g, currentSpots);

  const copyCode = () => {
    if (roomState?.code) {
      navigator.clipboard.writeText(roomState.code);
      setCopied(true);
      soundManager.playBeep(1000, 0.05);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRemoveLastBot = () => {
    if (bots.length > 0 && onRemoveBot) {
      soundManager.playBeep(500, 0.06);
      onRemoveBot(bots[bots.length - 1].id);
    }
  };

  const handleStartClick = () => {
    if (!canStart) {
      soundManager.playBeep(400, 0.1);
      setStartWarning(t.needMorePlayersAlert || 'Для старта игры нужно минимум 3 игрока! Добавьте ботов.');
      setTimeout(() => setStartWarning(''), 5000);
      return;
    }
    soundManager.playAlarm();
    onStartGame();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 animate-fadeIn">
      {/* Top Navigation Bar: Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            soundManager.playBeep(600, 0.05);
            if (onLeaveLobby) onLeaveLobby();
          }}
          className="px-4 py-2 rounded-2xl bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 text-xs font-mono font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.btnLeaveLobby || t.btnBack}</span>
        </button>

        <span className="text-xs font-mono text-zinc-500">
          {t.bunkerRoomLabel || (lang === 'ru' ? 'Бункер' : 'Bunker')} #{roomState?.code}
        </span>
      </div>

      {/* Warning Alert if player clicked Start without 3 players */}
      {startWarning && (
        <div className="p-3 bg-amber-500/15 border-2 border-amber-500/50 rounded-2xl flex items-center space-x-2 text-xs font-mono text-amber-500 animate-bounce">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{startWarning}</span>
        </div>
      )}

      {/* Top Banner with 5-digit code */}
      <div className="border border-amber-500/30 bg-white dark:bg-zinc-900/90 rounded-3xl p-5 sm:p-7 relative overflow-hidden shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-amber-600 dark:text-amber-500 font-bold mb-1 flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              {t.title}
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white tracking-wide">
              {t.playersInLobby} #{roomState?.code}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
              {t.shareCodeHint}
            </p>
          </div>

          {/* Big Code Badge */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-black/90 border-2 border-amber-500/60 rounded-2xl p-3 px-5 shadow-[0_0_25px_rgba(245,158,11,0.12)]">
            <span className="text-3xl sm:text-4xl font-display font-bold text-amber-600 dark:text-amber-400 tracking-widest">
              {roomState?.code}
            </span>
            <button
              onClick={copyCode}
              title={t.copyCodeTooltip || (lang === 'ru' ? "Скопировать цифровой код" : lang === 'uz' ? "Xona kodini nusxalash" : "Copy room code")}
              className="p-2 rounded-xl bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-amber-500 transition ml-2 cursor-pointer"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Dynamic Places rule badge */}
        <div className="mt-5 p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300 font-mono">
          <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
          <span>{formattedRule}</span>
        </div>
      </div>

      {/* Players List */}
      <div className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 rounded-3xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            <h2 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white">
              {t.playersInLobby} ({players.length} / 12)
            </h2>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-mono font-bold ${
            canStart ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
          }`}>
            {canStart ? t.readyToStart : `${t.needMorePlayers} ${minPlayers - players.length}`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {players.map((p, idx) => (
            <div
              key={p.id}
              className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                p.id === myPlayerId
                  ? 'bg-amber-50/70 dark:bg-amber-500/10 border-amber-400 dark:border-amber-500/60 shadow-sm'
                  : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="shrink-0">
                  <CharacterAvatar character={p.character} isAlive={p.isAlive} size="sm" lang={lang} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold truncate text-slate-900 dark:text-white">
                    {p.name} {p.id === myPlayerId && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">{t.you}</span>}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono flex items-center space-x-1">
                    <span>{p.isHost ? t.roleHost : p.isBot ? t.roleBot : t.rolePlayer}</span>
                    {p.character?.title && (
                      <>
                        <span>•</span>
                        <span className={p.character?.titleColor || 'text-amber-500 font-bold'}>
                          {getLocalized(p.character.title, lang)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Bot Delete Button for Host */}
              {isHost && p.isBot ? (
                <button
                  onClick={() => {
                    soundManager.playBeep(500, 0.06);
                    onRemoveBot(p.id);
                  }}
                  title={t.removeBotTooltip || (lang === 'ru' ? "Удалить этого бота" : lang === 'uz' ? "Botni o'chirish" : "Remove this bot")}
                  className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900 text-red-600 dark:text-red-400 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              )}
            </div>
          ))}
        </div>

        {/* Action Controls */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
            {t.rulesShort}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Add Bot Button (Up to 12 players) */}
            {isHost && players.length < 12 && (
              <button
                onClick={() => {
                  soundManager.playBeep(650, 0.06);
                  onAddBot();
                }}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-cyan-700 dark:text-cyan-300 border border-slate-300 dark:border-cyan-800/40 text-xs font-bold font-mono transition cursor-pointer shadow-sm"
              >
                {t.btnAddBot}
              </button>
            )}

            {/* Remove Last Bot Button */}
            {isHost && bots.length > 0 && (
              <button
                onClick={handleRemoveLastBot}
                className="px-3.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <UserMinus className="w-3.5 h-3.5" />
                <span>{t.btnRemoveBot}</span>
              </button>
            )}

            {/* Start Game Button */}
            {isHost ? (
              <button
                onClick={handleStartClick}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-display font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition cursor-pointer ${
                  canStart
                    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 animate-pulse'
                    : 'bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-500 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{t.btnStart}</span>
                {!canStart && <span className="text-[10px] font-mono opacity-80">{t.min3Players || (lang === 'uz' ? '(kamida 3)' : lang === 'en' ? '(min 3)' : '(минимум 3)')}</span>}
              </button>
            ) : (
              <div className="text-xs text-amber-600 dark:text-amber-400 font-mono bg-amber-50 dark:bg-zinc-950 px-4 py-2 rounded-xl border border-amber-200 dark:border-zinc-800 animate-pulse">
                {t.waitingHost}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
