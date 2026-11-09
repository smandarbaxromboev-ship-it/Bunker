import React from 'react';
import { Ghost, ArrowRight, ArrowLeft } from 'lucide-react';
import { translations } from '../utils/translations';
import { soundManager } from '../utils/audio';

export default function GhostVisionHUD({ ghostVotes, onLeaveRoom, lang = 'ru' }) {
  const t = translations[lang] || translations.ru;

  if (!ghostVotes || ghostVotes.length === 0) {
    return (
      <div className="mb-4 p-3.5 rounded-2xl bg-purple-950/40 border border-purple-800/60 text-xs font-mono text-purple-300 flex flex-wrap items-center justify-between gap-2 shadow-lg">
        <div className="flex items-center gap-2">
          <Ghost className="w-5 h-5 text-purple-400 animate-bounce shrink-0" />
          <div>
            <span className="font-bold block">{t.ghostBanner}</span>
            <span className="text-[11px] text-purple-400/80 animate-pulse">{t.ghostWaiting}</span>
          </div>
        </div>
        {onLeaveRoom && (
          <button
            onClick={() => {
              soundManager.playBeep(600, 0.05);
              onLeaveRoom();
            }}
            className="px-3 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-700/70 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{lang === 'uz' ? 'Menyuga chiqish' : lang === 'en' ? 'Exit to Menu' : 'Выйти в меню'}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mb-4 p-4 rounded-2xl bg-purple-950/50 border-2 border-purple-600/80 text-xs font-mono shadow-[0_0_25px_rgba(168,85,247,0.25)] animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-800/60 pb-2 mb-3">
        <div className="flex items-center gap-2 text-purple-300 font-bold">
          <Ghost className="w-5 h-5 text-purple-400 animate-bounce" />
          <span className="text-sm font-display tracking-wide">{t.ghostBanner}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700">
            {t.ghostVotesCount} {ghostVotes.length}
          </span>
          {onLeaveRoom && (
            <button
              onClick={() => {
                soundManager.playBeep(600, 0.05);
                onLeaveRoom();
              }}
              className="px-2.5 py-1 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-700/70 text-[11px] font-mono font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>{lang === 'uz' ? 'Chiqish' : lang === 'en' ? 'Exit' : 'Выйти'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ghostVotes.map((v, i) => (
          <div
            key={i}
            className="p-2 rounded-xl bg-black/60 border border-purple-800/70 flex items-center justify-between text-xs text-zinc-200"
          >
            <span className="font-bold text-white">{v.voterName}</span>
            <div className="flex items-center gap-1.5 text-purple-400 text-[11px]">
              <ArrowRight className="w-3.5 h-3.5" />
              <span>{t.ghostVotedFor}</span>
            </div>
            <span className="font-bold text-red-400">{v.targetName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

