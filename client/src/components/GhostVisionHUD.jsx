import React from 'react';
import { Ghost, Eye, ArrowRight, ShieldAlert } from 'lucide-react';
import { translations } from '../utils/translations';

export default function GhostVisionHUD({ ghostVotes, lang = 'ru' }) {
  const t = translations[lang] || translations.ru;

  if (!ghostVotes || ghostVotes.length === 0) {
    return (
      <div className="mb-4 p-3.5 rounded-2xl bg-purple-950/40 border border-purple-800/60 text-xs font-mono text-purple-300 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <Ghost className="w-5 h-5 text-purple-400 animate-bounce" />
          <span className="font-bold">{t.ghostBanner}</span>
        </div>
        <span className="text-[11px] text-purple-400/80 animate-pulse">{t.ghostWaiting}</span>
      </div>
    );
  }

  return (
    <div className="mb-4 p-4 rounded-2xl bg-purple-950/50 border-2 border-purple-600/80 text-xs font-mono shadow-[0_0_25px_rgba(168,85,247,0.25)] animate-fadeIn">
      <div className="flex items-center justify-between border-b border-purple-800/60 pb-2 mb-3">
        <div className="flex items-center gap-2 text-purple-300 font-bold">
          <Ghost className="w-5 h-5 text-purple-400 animate-bounce" />
          <span className="text-sm font-display tracking-wide">{t.ghostBanner}</span>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700">
          {t.ghostVotesCount} {ghostVotes.length}
        </span>
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

