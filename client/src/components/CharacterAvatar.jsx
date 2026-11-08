import React from 'react';
import { getLocalized } from '../utils/translations';

export default function CharacterAvatar({
  character,
  isAlive = true,
  isExiled = false,
  size = 'md', // 'sm', 'md', 'lg', 'xl'
  lang = 'ru',
  showTitle = false
}) {
  const char = character || {
    avatar: '🥷',
    name: { ru: 'Сталкер', en: 'Stalker', uz: 'Izquvar' },
    borderClass: 'border-slate-500/60',
    glowClass: '',
    title: { ru: 'Выживший', en: 'Survivor', uz: 'Omon Qolgan' },
    titleColor: 'text-slate-400'
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-base border',
    md: 'w-11 h-11 text-xl border-2',
    lg: 'w-16 h-16 text-3xl border-2',
    xl: 'w-24 h-24 text-5xl border-4'
  }[size] || 'w-11 h-11 text-xl border-2';

  const titleSizeClass = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-sm'
  }[size] || 'text-[10px]';

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`relative rounded-xl flex items-center justify-center transition-all duration-300 ${sizeClasses} ${
          !isAlive || isExiled
            ? 'border-red-600/80 bg-red-950/40 opacity-70 grayscale shadow-[0_0_12px_rgba(239,68,68,0.4)]'
            : `${char.borderClass || 'border-amber-500/50'} ${char.glowClass || ''} bg-zinc-900/90 dark:bg-black/80 shadow-md`
        }`}
      >
        {char.avatarUrl ? (
          <img
            src={char.avatarUrl}
            alt={char.name?.ru || 'Avatar'}
            className="w-full h-full object-cover rounded-xl select-none"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.nextSibling) {
                e.currentTarget.nextSibling.style.display = 'block';
              }
            }}
          />
        ) : null}
        <span 
          className="select-none filter drop-shadow" 
          style={{ display: char.avatarUrl ? 'none' : 'block' }}
        >
          {char.avatar || '🥷'}
        </span>

        {/* Ghost / Exiled skull badge overlay */}
        {(!isAlive || isExiled) && (
          <div className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow animate-bounce">
            💀
          </div>
        )}
      </div>

      {showTitle && char.title && (
        <span
          className={`mt-1 font-mono uppercase tracking-wider text-center font-bold ${titleSizeClass} ${
            !isAlive || isExiled ? 'text-red-500 line-through' : (char.titleColor || 'text-amber-400')
          }`}
        >
          {getLocalized(char.title, lang)}
        </span>
      )}
    </div>
  );
}

