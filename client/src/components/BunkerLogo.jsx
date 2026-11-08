import React from 'react';
import { translations } from '../utils/translations';

export default function BunkerLogo({ size = 'md', animated = true, className = '', lang = 'ru' }) {
  const t = translations[lang] || translations.ru;
  const isSm = size === 'sm';
  const isLg = size === 'lg';
  const isHero = size === 'hero';

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
    hero: 'w-20 h-20 sm:w-24 sm:h-24'
  }[size] || 'w-11 h-11';

  const titleSizes = {
    sm: 'text-sm sm:text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl sm:text-3xl',
    hero: 'text-3xl sm:text-5xl md:text-6xl'
  }[size] || 'text-lg';

  const subSizes = {
    sm: 'text-[8px]',
    md: 'text-[9px] sm:text-[10px]',
    lg: 'text-xs',
    hero: 'text-xs sm:text-sm'
  }[size] || 'text-[10px]';

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3.5 select-none group ${className}`}>
      {/* Animated Bunker Biohazard Emblem */}
      <div className={`relative ${iconSizes} shrink-0`}>
        {/* Outer Biohazard Ambient Glow */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-amber-500/60 via-lime-400/30 to-red-500/50 blur-md animate-pulse group-hover:blur-lg transition-all" />

        {/* Outer Vault Ring */}
        <div className="relative w-full h-full rounded-2xl bg-zinc-950 border-2 border-amber-500 shadow-[0_0_24px_rgba(245,158,11,0.55)] flex items-center justify-center overflow-hidden">
          {/* Rotating Radiation Radar Sweep */}
          <div className={`absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(132,204,22,0.35)_90deg,transparent_180deg,rgba(245,158,11,0.35)_270deg,transparent_360deg)] ${animated ? 'animate-[spin_6s_linear_infinite]' : ''}`} />

          {/* SVG Radiation Trefoil Crest */}
          <svg
            className={`w-2/3 h-2/3 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.95)] ${animated ? 'animate-[spin_16s_linear_infinite] group-hover:scale-110 transition-transform duration-500' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="2.5" fill="#84cc16" stroke="none" />
            <path d="M12 9.5a5.5 5.5 0 0 1 4.76 2.75l2.6-1.5A8.5 8.5 0 0 0 12 6.5v3z" fill="currentColor" />
            <path d="M14.16 13.25a5.5 5.5 0 0 1-4.32 2.5v3a8.5 8.5 0 0 0 6.92-4l-2.6-1.5z" fill="currentColor" />
            <path d="M9.84 13.25l-2.6 1.5a8.5 8.5 0 0 0 6.92 4v-3a5.5 5.5 0 0 1-4.32-2.5z" fill="currentColor" transform="rotate(120 12 12)" />
            <circle cx="12" cy="12" r="10" stroke="#84cc16" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.85" />
          </svg>

          {/* Center Danger LED pulse */}
          <div className="absolute w-2 h-2 rounded-full bg-lime-400 shadow-[0_0_10px_#84cc16] animate-ping" />
        </div>
      </div>

      {/* Typography */}
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-display font-black tracking-widest uppercase text-slate-900 dark:text-white drop-shadow-[0_2px_12px_rgba(245,158,11,0.35)] ${titleSizes}`}>
            {t.logoTitle || 'БУНКЕР'}
          </span>
          <span className={`font-display font-black text-amber-500 drop-shadow-[0_0_14px_rgba(245,158,11,0.8)] animate-pulse ${titleSizes}`}>
            :7
          </span>
        </div>

        <div className={`font-mono font-bold tracking-widest uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mt-0.5 ${subSizes}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-lime-500 shadow-[0_0_8px_#84cc16] animate-ping" />
          <span>{t.logoSub || 'РАУНДОВ ОТКРОВЕНИЙ'}</span>
        </div>
      </div>
    </div>
  );
}
