import React from 'react';
import { 
  X, Calendar, Briefcase, HeartPulse, Sparkles, 
  Backpack, FileText, ShieldAlert, Lock, User, CheckCircle 
} from 'lucide-react';
import { translations, getLocalized } from '../utils/translations';

const ICON_MAP = {
  age: Calendar,
  profession: Briefcase,
  health: HeartPulse,
  hobby: Sparkles,
  luggage: Backpack,
  fact: FileText,
  special: ShieldAlert
};

export default function CardDetailModal({ cardData, onClose, lang = 'ru' }) {
  if (!cardData) return null;

  const { player, card } = cardData;
  const t = translations[lang] || translations.ru;
  const IconComp = ICON_MAP[card.type] || FileText;
  const isRevealed = card.revealed;

  const cardName = getLocalized(card.name, lang);
  const cardValue = getLocalized(card.value, lang);
  const cardDesc = getLocalized(card.description, lang);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white bg-slate-100 dark:bg-zinc-900 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Player Header */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-zinc-400 mb-4 pb-3 border-b border-slate-100 dark:border-zinc-850">
          <User className="w-3.5 h-3.5 text-amber-500" />
          <span>{t.cardPlayerLabel}</span>
          <strong className="text-slate-800 dark:text-zinc-200 text-sm font-display font-bold">
            {player.name}
          </strong>
        </div>

        {/* Card Category & Icon */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400 shrink-0 border border-amber-500/30">
            <IconComp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase font-bold text-amber-600 dark:text-amber-400 font-mono tracking-wider">
              {cardName}
            </div>
            <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900 dark:text-white mt-0.5 leading-snug">
              {cardValue}
            </h3>
          </div>
        </div>

        {/* Card Full Description */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 mb-5">
          <div className="text-[11px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase mb-1">
            {t.cardFullDescLabel}
          </div>
          <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-sans sm:font-mono">
            {cardDesc || t.cardNoDesc}
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-105 dark:border-zinc-850">
          <div className="flex items-center gap-1.5">
            {isRevealed ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                {t.cardOpen}
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-bold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                {t.cardLocked}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100 font-display font-bold text-xs transition"
          >
            {t.btnClose}
          </button>
        </div>
      </div>
    </div>
  );
}

