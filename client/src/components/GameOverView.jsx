import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, ShieldCheck, UserCheck, Eye, Sparkles } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { translations, getLocalized } from '../utils/translations';
import PlayerCard from './PlayerCard';

export default function GameOverView({ roomState, myPlayerId, onRestart, lang = 'ru' }) {
  const t = translations[lang] || translations.ru;
  const isHost = roomState?.hostId === myPlayerId;
  const players = roomState?.players || [];
  const winners = players.filter(p => p.isAlive).slice(0, 2); // Строго 2 победителя!
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
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* Top Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          {t.roundsCompleted}
        </div>
        <h1 className="text-3xl sm:text-5xl font-display font-black text-white tracking-wide">
          {t.winnersTitle}
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
            {winners.map(w => w.name).join('  &  ')}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto my-6">
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

      {/* Restart Button */}
      <div className="pt-6 border-t border-zinc-800 flex justify-center">
        {isHost ? (
          <button
            onClick={() => {
              soundManager.playBeep(800, 0.1);
              onRestart();
            }}
            className="px-8 py-3.5 rounded-2xl font-display font-bold text-base tracking-wider flex items-center gap-3 bg-amber-500 hover:bg-amber-400 text-black shadow-xl shadow-amber-500/20 transition cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            {t.btnPlayAgain}
          </button>
        ) : (
          <div className="text-sm text-zinc-400 font-mono">
            {t.waitingHost}
          </div>
        )}
      </div>
    </div>
  );
}
