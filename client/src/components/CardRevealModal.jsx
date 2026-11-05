import React, { useState } from 'react';
import { 
  Eye, Lock, ShieldAlert, HeartPulse, Briefcase, Calendar, 
  Sparkles, Backpack, FileText, CheckCircle2, Clock, User 
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { translations, getLocalized } from '../utils/translations';
import CountdownTimer from './CountdownTimer';

const ICON_MAP = {
  age: Calendar,
  profession: Briefcase,
  health: HeartPulse,
  hobby: Sparkles,
  luggage: Backpack,
  fact: FileText,
  special: ShieldAlert
};

export default function CardRevealModal({ 
  myPlayer, 
  currentRound, 
  onRevealCard, 
  expiresAt, 
  activeTurnPlayer,
  isMyTurn,
  lang = 'ru' 
}) {
  const [selectedCardId, setSelectedCardId] = useState(null);
  const t = translations[lang] || translations.ru;

  if (!myPlayer || !myPlayer.isAlive) return null;

  const hasRevealedThisRound = myPlayer.hasRevealedThisRound;
  const deck = myPlayer.deck || [];
  const unrevealedCards = deck.filter(c => !c.revealed);

  const handleConfirmReveal = (cardId) => {
    soundManager.playCardReveal();
    onRevealCard(cardId);
    setSelectedCardId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-zinc-950 border-2 border-amber-500/60 rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-[0_0_40px_rgba(245,158,11,0.2)] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-slate-100 dark:border-zinc-850 pb-3 mb-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs uppercase tracking-wider text-amber-600 dark:text-amber-500 font-bold flex items-center gap-1.5 font-mono">
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              {t.round} {currentRound} / 7
            </span>

            {/* 60-Second Countdown Timer */}
            {expiresAt && (
              <CountdownTimer expiresAt={expiresAt} timerType="REVEAL" lang={lang} />
            )}
          </div>

          {/* Turn Announcement */}
          {isMyTurn ? (
            <div className="mt-2 p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 text-amber-800 dark:text-amber-300 flex items-center gap-2 animate-pulse">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="text-xs sm:text-sm font-bold font-display">
                {t.yourTurnTitle}
              </div>
            </div>
          ) : (
            <div className="mt-2 p-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-500 shrink-0" />
              <div className="text-xs sm:text-sm font-medium">
                {t.otherTurnTitle} <strong className="text-slate-900 dark:text-white font-bold">{activeTurnPlayer?.name || '...'}</strong> {t.waitYourTurn}
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono mt-1">
            {t.revealModalHint}
          </p>
        </div>

        {/* Card choices */}
        <div className="overflow-y-auto pr-1 space-y-2 flex-1">
          {hasRevealedThisRound ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-500 dark:text-emerald-400 mx-auto flex items-center justify-center animate-pulse">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="font-display font-bold text-base text-emerald-600 dark:text-emerald-400">
                {t.alreadyRevealedTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                {t.alreadyRevealedDesc}
              </p>
            </div>
          ) : (
            deck.map((card) => {
              const IconComp = ICON_MAP[card.type] || FileText;
              const isRevealed = card.revealed;
              const isSelected = selectedCardId === card.id;
              const cardName = getLocalized(card.name, lang);
              const cardValue = getLocalized(card.value, lang);
              const cardDesc = getLocalized(card.description, lang);

              return (
                <div
                  key={card.id}
                  onClick={() => {
                    if (!isRevealed && isMyTurn) {
                      soundManager.playBeep(700, 0.05);
                      setSelectedCardId(card.id);
                    }
                  }}
                  className={`p-3 rounded-2xl border transition-all text-left ${
                    isRevealed
                      ? 'bg-slate-100 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800/80 opacity-50 cursor-not-allowed'
                      : !isMyTurn
                      ? 'bg-slate-50 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md cursor-pointer ring-1 ring-amber-500'
                      : 'bg-white dark:bg-zinc-900/90 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 cursor-pointer shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl shrink-0 ${
                        isRevealed ? 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500' : isSelected ? 'bg-amber-500 text-black' : 'bg-slate-100 dark:bg-zinc-800 text-amber-500 dark:text-amber-400'
                      }`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase font-mono">
                            {cardName}
                          </span>
                          {isRevealed && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-500 font-mono">
                              {t.cardOpen}
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                          {cardValue}
                        </div>
                        {cardDesc && (
                          <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                            {cardDesc}
                          </div>
                        )}
                      </div>
                    </div>

                    {!isRevealed && isMyTurn && (
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-amber-500 bg-amber-500 text-black' : 'border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800'
                      }`}>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-black"></span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Submit */}
        {!hasRevealedThisRound && isMyTurn && (
          <div className="pt-3 mt-2 border-t border-slate-100 dark:border-zinc-850 flex justify-end">
            <button
              onClick={() => handleConfirmReveal(selectedCardId)}
              disabled={!selectedCardId}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-display font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition ${
                selectedCardId
                  ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 cursor-pointer animate-pulse'
                  : 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed'
              }`}
            >
              <Eye className="w-4 h-4" />
              {t.btnReveal}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
