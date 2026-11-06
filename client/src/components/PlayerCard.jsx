import React, { useState } from 'react';
import { 
  Calendar, Briefcase, HeartPulse, Sparkles, 
  Backpack, FileText, ShieldAlert, Lock, Skull, Check, User, Ghost, Maximize2 
} from 'lucide-react';
import { translations, getLocalized } from '../utils/translations';
import CharacterAvatar from './CharacterAvatar';

const ICON_MAP = {
  age: Calendar,
  profession: Briefcase,
  health: HeartPulse,
  hobby: Sparkles,
  luggage: Backpack,
  fact: FileText,
  special: ShieldAlert
};

export default function PlayerCard({ 
  player, 
  isSelf, 
  isVoting, 
  onVoteTarget, 
  hasVotedForThis, 
  onInspectCard,
  onUseTrump,
  lang = 'ru' 
}) {
  const [expandedCardId, setExpandedCardId] = useState(null);
  const t = translations[lang] || translations.ru;
  const isAlive = player.isAlive;
  const deck = player.deck || [];
  const character = player.character;

  const handleCardClick = (card) => {
    // Toggle in-place expand or trigger modal inspector
    if (expandedCardId === card.id) {
      setExpandedCardId(null);
    } else {
      setExpandedCardId(card.id);
    }

    if (onInspectCard) {
      onInspectCard({ player, card });
    }
  };

  return (
    <div
      className={`rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between relative ${
        !isAlive
          ? 'bg-slate-100 dark:bg-zinc-950/80 border-red-600/60 opacity-60 shadow-none grayscale-[40%]'
          : isSelf
          ? 'bg-white dark:bg-zinc-900 border-amber-500 shadow-md ring-2 ring-amber-500/40'
          : 'bg-white dark:bg-zinc-900/90 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 shadow-sm'
      }`}
    >
      {/* Top Header Card Bar */}
      <div className={`p-3 sm:p-3.5 border-b flex items-center justify-between gap-2 ${
        !isAlive 
          ? 'border-red-900/50 bg-red-950/20 text-slate-500 dark:text-zinc-500' 
          : isSelf 
          ? 'border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10' 
          : 'border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/40'
      }`}>
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <CharacterAvatar
            character={character}
            isAlive={isAlive}
            isExiled={!isAlive}
            size="md"
            lang={lang}
          />

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`font-display font-bold text-sm sm:text-base truncate ${
                !isAlive ? 'line-through text-red-500 dark:text-red-400' : isSelf ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
              }`}>
                {player.name}
              </span>
              {isSelf && (
                <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono font-bold shrink-0">
                  {t.youBadge}
                </span>
              )}
            </div>
            
            <div className="text-[10px] font-mono flex items-center gap-1.5 mt-0.5">
              {character?.title && (
                <span className={`font-bold uppercase tracking-wider truncate max-w-[120px] ${
                  !isAlive ? 'line-through text-zinc-500' : (character.titleColor || 'text-slate-400')
                }`}>
                  {getLocalized(character.title, lang)}
                </span>
              )}

              <span className="text-zinc-600 dark:text-zinc-700">•</span>

              {isAlive ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  {t.alive}
                </span>
              ) : (
                <span className="text-red-600 dark:text-red-400 font-extrabold flex items-center gap-1 shrink-0 uppercase">
                  <span>💀</span>
                  {t.exiled}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Voting Button during voting phase */}
        {isVoting && isAlive && !isSelf && (
          <button
            onClick={() => onVoteTarget(player.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition flex items-center gap-1 shrink-0 ${
              hasVotedForThis
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 dark:bg-red-950/60 dark:hover:bg-red-900 dark:text-red-300 dark:border-red-800'
            }`}
          >
            {hasVotedForThis && <Check className="w-3.5 h-3.5" />}
            <span>{hasVotedForThis ? t.selectedTarget : t.btnVote}</span>
          </button>
        )}
      </div>

      {/* 7 Clean Card Slots */}
      <div className="p-2 sm:p-3 space-y-1.5 flex-1">
        {deck.map((card, i) => {
          const IconComp = ICON_MAP[card.type] || FileText;
          const isRevealed = card.revealed;
          const isExpanded = expandedCardId === card.id;

          const cardName = getLocalized(card.name, lang);
          const cardValue = getLocalized(card.value, lang);
          const cardDesc = getLocalized(card.description, lang);

          return (
            <div
              key={card.id || i}
              onClick={() => handleCardClick(card)}
              title="Нажмите, чтобы прочитать полностью"
              className={`p-2 sm:p-2.5 rounded-2xl border text-xs transition-all cursor-pointer select-none ${
                !isRevealed
                  ? 'bg-slate-50 dark:bg-zinc-950/40 border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 hover:border-slate-300 dark:hover:border-zinc-700'
                  : isExpanded
                  ? 'bg-amber-50 dark:bg-zinc-950 border-amber-400 dark:border-amber-500/80 shadow-md ring-1 ring-amber-400'
                  : 'bg-slate-50/70 dark:bg-zinc-950/90 border-slate-200 dark:border-zinc-750 text-slate-800 dark:text-zinc-200 hover:border-amber-300 dark:hover:border-zinc-600 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={`p-1.5 rounded-xl shrink-0 ${
                    !isRevealed 
                      ? 'bg-slate-200 dark:bg-zinc-900 text-slate-400 dark:text-zinc-600' 
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}>
                    <IconComp className="w-3.5 h-3.5" />
                  </div>
                  
                  <span className="font-bold text-slate-500 dark:text-zinc-400 text-[11px] shrink-0 font-mono">
                    {cardName}:
                  </span>

                  {/* Fully displayed on expand or click, with neat fallback */}
                  <span className={`text-xs font-medium ${
                    !isRevealed 
                      ? 'text-slate-400 dark:text-zinc-600 italic font-mono truncate' 
                      : isExpanded
                      ? 'text-amber-700 dark:text-amber-300 font-bold break-words'
                      : 'text-amber-600 dark:text-amber-300 truncate'
                  }`}>
                    {cardValue}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!isRevealed ? (
                    <Lock className="w-3 h-3 text-slate-400 dark:text-zinc-600" />
                  ) : (
                    <>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-mono font-bold">
                        {t.cardOpen}
                      </span>
                      <Maximize2 className="w-3 h-3 text-slate-400 dark:text-zinc-500 opacity-60 hover:opacity-100 ml-0.5" />
                    </>
                  )}
                </div>
              </div>

              {/* Full description shown on expansion or reveal */}
              {isRevealed && cardDesc && (
                <div className={`mt-1.5 pl-6 text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed ${
                  isExpanded ? 'block' : 'line-clamp-1'
                }`}>
                  {cardDesc}
                </div>
              )}

              {/* Functional Trump Trigger Button */}
              {card.type === 'special' && isSelf && isAlive && (
                <div className="mt-2 pl-6 pt-1 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                  {!card.used ? (
                    <button
                      type="button"
                      onClick={() => onUseTrump && onUseTrump(card)}
                      className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-98 text-black font-display font-bold text-[11px] shadow-sm flex items-center justify-center gap-1.5 animate-pulse cursor-pointer border border-amber-600/30"
                    >
                      <span>{t.btnUseTrump}</span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 font-semibold italic">
                      {t.trumpAlreadyUsed}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
