import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { translations } from '../utils/translations';

export default function CountdownTimer({ expiresAt, timerType, lang = 'ru' }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const t = translations[lang] || translations.ru;

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const remainingMs = Math.max(0, expiresAt - Date.now());
      const remainingSec = Math.floor(remainingMs / 1000);
      setTimeLeft(remainingSec);

      // Warning beep on final 5 seconds of reveal turn
      if (timerType === 'REVEAL' && remainingSec <= 5 && remainingSec > 0) {
        soundManager.playBeep(900, 0.05);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, timerType]);

  if (!expiresAt || timeLeft <= 0) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const isCritical = timeLeft < 60; // Less than 1 minute
  const isUrgent = timeLeft < 180; // Less than 3 minutes

  return (
    <div
      className={`px-3 py-1 rounded-xl font-mono font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-sm ${
        isCritical
          ? 'bg-red-500 text-white animate-pulse shadow-red-500/30'
          : isUrgent
          ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700'
          : 'bg-slate-100 text-slate-800 border border-slate-200 dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-800'
      }`}
    >
      <Clock className={`w-3.5 h-3.5 ${isCritical ? 'animate-spin' : ''}`} />
      <span className="tracking-widest">{formatted}</span>
      <span className="text-[10px] hidden sm:inline opacity-80 uppercase font-sans">
        {timerType === 'REVEAL' ? t.turnTime60s : t.roundTime20m}
      </span>
    </div>
  );
}
