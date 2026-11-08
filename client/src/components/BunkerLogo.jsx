import React from 'react';

export default function BunkerLogo({ size = 'md', animated = true, className = '' }) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';
  const isHero = size === 'hero';

  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    hero: 'w-20 h-20 sm:w-24 sm:h-24'
  }[size] || 'w-10 h-10';

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
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none group ${className}`}>
      {/* Animated Bunker Emblem */}
      <div className={`relative ${iconSizes} shrink-0`}>
        {/* Outer Biohazard Ambient Glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-amber-500/40 via-yellow-400/20 to-red-500/30 blur-md group-hover:blur-lg transition-all" />

        {/* Outer Vault Ring with Stencil Teeth */}
        <div className="relative w-full h-full rounded-2xl bg-zinc-950 border-2 border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center overflow-hidden">
          {/* Subtle Radiation rotating rays */}
          <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/30 via-transparent to-transparent ${animated ? 'animate-[spin_18s_linear_infinite]' : ''}`} />

          {/* SVG Radiation Biohazard Crest */}
          <svg
            className={`w-3/5 h-3/5 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] ${animated ? 'group-hover:scale-110 transition-transform duration-500' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Radiation trefoil symbol */}
            <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
            <path d="M12 9.5a5.5 5.5 0 0 1 4.76 2.75l2.6-1.5A8.5 8.5 0 0 0 12 6.5v3z" fill="currentColor" />
            <path d="M14.16 13.25a5.5 5.5 0 0 1-4.32 2.5v3a8.5 8.5 0 0 0 6.92-4l-2.6-1.5z" fill="currentColor" />
            <path d="M9.84 13.25l-2.6 1.5a8.5 8.5 0 0 0 6.92 4v-3a5.5 5.5 0 0 1-4.32-2.5z" fill="currentColor" transform="rotate(120 12 12)" />
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
          </svg>

          {/* Center Danger LED pulse */}
          <div className="absolute w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] animate-ping" />
        </div>
      </div>

      {/* Typography */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`font-display font-black tracking-widest uppercase text-white drop-shadow-[0_2px_12px_rgba(245,158,11,0.25)] ${titleSizes}`}>
            БУНКЕР
          </span>
          <span className={`font-display font-black text-amber-500 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)] ${titleSizes}`}>
            :7
          </span>
        </div>

        <div className={`font-mono font-bold tracking-widest uppercase text-amber-500/90 flex items-center gap-1 ${subSizes}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>РАУНДОВ ОТКРОВЕНИЙ</span>
        </div>
      </div>
    </div>
  );
}
