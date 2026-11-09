import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, ShieldCheck, UserCheck, Eye, Sparkles, ArrowLeft } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { translations, getLocalized } from '../utils/translations';
import PlayerCard from './PlayerCard';

export default function GameOverView({ roomState, myPlayerId, onRestart, onLeaveGame, lang = 'ru' }) {
  const t = translations[lang] || translations.ru;
  const isHost = roomState?.hostId === myPlayerId;
  const players = roomState?.players || [];
  const winners = players.filter(p => p.isAlive);
  const exiled = players.filter(p => !p.isAlive);

  useEffect(() => {
    soundManager.playVictory();
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 }
    });
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-2 sm:py-4">
      {/* Quick Action Bar at Top so players/ghosts can immediately exit or play again without scrolling */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-lg">
        {onLeaveGame && (
          <button
            onClick={() => {
              soundManager.playBeep(600, 0.05);
              onLeaveGame();
            }}
            className="px-5 py-2.5 rounded-xl font-display font-bold text-xs sm:text-sm tracking-wider flex items-center gap-2 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 transition cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.btnLeaveGame || (lang === 'uz' ? '← Asosiy menyuga chiqish' : lang === 'en' ? '← Return to Main Menu' : '← Выйти в главное меню')}</span>
          </button>
        )}

        <button
          onClick={() => {
            soundManager.playBeep(800, 0.1);
            onRestart();
          }}
          className="px-5 py-2.5 rounded-xl font-display font-bold text-xs sm:text-sm tracking-wider flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{t.btnPlayAgain}</span>
        </button>
      </div>

      {/* Top Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          {t.roundsCompleted}
        </div>
        <h1 className="text-3xl sm:text-5xl font-display font-black text-white tracking-wide">
          {lang === 'uz'
            ? `BUNKER G'OLIBLARI (${winners.length} TA OMON QOLGAN):`
            : lang === 'en'
            ? `BUNKER WINNERS (${winners.length} SURVIVORS):`
            : `ПОБЕДИТЕЛИ БУНКЕРА (${winners.length} ВЫЖИВШИХ):`}
        </h1>
        <p className="text-sm text-zinc-400 max-w-md mx-auto">
          {t.winnersDesc}
        </p>
      </div>

      {/* Massive 2 Winners Highlight */}
      <div className="border-2 border-emerald-500/60 bg-emerald-950/20 rounded-3xl p-6 sm:p-10 shadow-[0_0_60px_rgba(16,185,129,0.2)] text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
          <h2 className="font-display font-black text-2xl sm:text-4xl text-emerald-300 uppercase tracking-widest">
            {winners.map(w => w.name).join('  •  ')}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto my-6">
          {winners.map((p, idx) => (
            <div
              key={p.id}
              className="p-5 rounded-2xl bg-black/80 border-2 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.3)] flex items-center gap-4 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500 text-black flex items-center justify-center font-display font-black text-xl shrink-0 shadow-lg">
                #{idx + 1}
              </div>
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-display font-bold text-white truncate">
                  {p.name}
                </div>
                <div className="text-xs text-emerald-400 font-mono font-medium mt-0.5">
                  {t.savedInBunkerPlace.replace('{num}', idx + 1)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Exiled summary */}
        {exiled.length > 0 && (
          <div className="pt-4 border-t border-emerald-900/40 text-xs font-mono text-zinc-400 flex flex-wrap items-center justify-center gap-2">
            <span className="text-purple-400 font-bold">{t.bunkerGhostsTitle}</span>
            {exiled.map((p, i) => (
              <span key={p.id} className="line-through text-zinc-500">
                {p.name}{i < exiled.length - 1 ? ',' : ''}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Inspect All Cards (Check Bluff) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
          <Eye className="w-5 h-5 text-amber-400" />
          <h3 className="font-display font-bold text-xl text-white">
            {t.allCardsTitle}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              isSelf={p.id === myPlayerId}
              isVoting={false}
              lang={lang}
            />
          ))}
        </div>
      </div>

      {/* Restart & Leave Buttons */}
      <div className="pt-6 border-t border-zinc-800 flex flex-wrap items-center justify-center gap-3">
        {onLeaveGame && (
          <button
            onClick={() => {
              soundManager.playBeep(600, 0.05);
              onLeaveGame();
            }}
            className="px-6 py-3.5 rounded-2xl font-display font-bold text-sm tracking-wider flex items-center gap-2 bg-red-950/60 hover:bg-red-900 text-red-200 border border-red-700/60 transition cursor-pointer shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.btnLeaveGame || '← В главное меню'}</span>
          </button>
        )}

        <button
          onClick={() => {
            soundManager.playBeep(800, 0.1);
            onRestart();
          }}
          className="px-8 py-3.5 rounded-2xl font-display font-bold text-base tracking-wider flex items-center gap-3 bg-amber-500 hover:bg-amber-400 text-black shadow-xl shadow-amber-500/20 transition cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span>{t.btnPlayAgain}</span>
        </button>
      </div>
    </div>
  );
}
