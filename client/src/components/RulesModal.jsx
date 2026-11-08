import React from 'react';
import { ShieldAlert, Users, Clock, Trophy, Ghost, Zap, Coins, CheckCircle, X, HelpCircle, AlertTriangle } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { translations } from '../utils/translations';

export default function RulesModal({ 
  isOpen, 
  isMandatory = false, 
  onUnderstand, 
  onClose, 
  lang = 'ru',
  setLang
}) {
  if (!isOpen) return null;
  const t = translations[lang] || translations.ru;

  const handleUnderstand = () => {
    soundManager.playBeep(950, 0.12);
    if (onUnderstand) onUnderstand();
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-zinc-950 border-2 border-amber-500 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.25)] p-5 sm:p-7 text-zinc-100 font-sans flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Radioactive ambient background glow */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Right Controls: Language Switcher & Optional Close Button */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          {setLang && (
            <div className="flex items-center bg-zinc-900 rounded-xl p-0.5 border border-zinc-800 text-[11px] font-mono font-bold">
              <button
                type="button"
                onClick={() => setLang('ru')}
                className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                  lang === 'ru' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                RU
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                  lang === 'en' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('uz')}
                className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                  lang === 'uz' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                UZ
              </button>
            </div>
          )}

          {!isMandatory && onClose && (
            <button
              onClick={() => {
                soundManager.playBeep(600, 0.05);
                onClose();
              }}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-zinc-850 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-500/80 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)] shrink-0 animate-pulse">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                {isMandatory ? t.rulesMandatoryBadge : t.rulesGuideBadge}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display tracking-wide text-white truncate mt-0.5">
              {t.rulesMainTitle}
            </h2>
          </div>
        </div>

        {/* Scrollable Rules Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 font-sans text-xs sm:text-sm">
          
          {/* Rule 1: Goal & Spots */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/80 border border-amber-500/30 hover:border-amber-500/60 transition space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-xs uppercase">
              <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{t.rulesSec1Title}</span>
            </div>
            <p className="text-zinc-300 leading-relaxed">
              {t.rulesSec1Desc}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px] text-center">
              <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-400 block">{t.rulesSec1Tier1}</span>
                <strong className="text-emerald-400 text-xs">{t.rulesSec1Tier1Spots}</strong>
              </div>
              <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-400 block">{t.rulesSec1Tier2}</span>
                <strong className="text-amber-400 text-xs">{t.rulesSec1Tier2Spots}</strong>
              </div>
              <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-400 block">{t.rulesSec1Tier3}</span>
                <strong className="text-amber-400 text-xs">{t.rulesSec1Tier3Spots}</strong>
              </div>
              <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-400 block">{t.rulesSec1Tier4}</span>
                <strong className="text-cyan-400 text-xs">{t.rulesSec1Tier4Spots}</strong>
              </div>
            </div>
          </div>

          {/* Rule 2: 7 Rounds & Timers */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-xs uppercase">
              <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{t.rulesSec2Title}</span>
            </div>
            <ul className="space-y-1.5 text-zinc-300 leading-relaxed list-disc list-inside">
              <li>{t.rulesSec2Reveals}</li>
              <li>{t.rulesSec2Debates}</li>
              <li>{t.rulesSec2Voting}</li>
              <li>{t.rulesSec2Extra}</li>
            </ul>
          </div>

          {/* Rule 3: Ghosts Mode */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-purple-950/30 border border-purple-500/40 hover:border-purple-500/70 transition space-y-1.5">
            <div className="flex items-center gap-2 text-purple-400 font-mono font-bold text-xs uppercase">
              <Ghost className="w-4 h-4 text-purple-400 shrink-0" />
              <span>{t.rulesSec3Title}</span>
            </div>
            <p className="text-zinc-300 leading-relaxed">
              {t.rulesSec3Desc}
            </p>
            <ul className="space-y-1 text-zinc-300 list-disc list-inside text-xs">
              <li>{t.rulesSec3Item1}</li>
              <li>{t.rulesSec3Item2}</li>
              <li>{t.rulesSec3Item3}</li>
            </ul>
          </div>

          {/* Rule 4: Trumps / Master Abilities */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/80 border border-yellow-500/30 hover:border-yellow-500/60 transition space-y-1.5">
            <div className="flex items-center gap-2 text-yellow-400 font-mono font-bold text-xs uppercase">
              <Zap className="w-4 h-4 text-yellow-400 shrink-0" />
              <span>{t.rulesSec4Title}</span>
            </div>
            <p className="text-zinc-300 leading-relaxed">
              {t.rulesSec4Desc}
            </p>
          </div>

          {/* Rule 5: Economy & BunCoins */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/80 border border-emerald-500/30 hover:border-emerald-500/60 transition space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs uppercase">
              <Coins className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{t.rulesSec5Title}</span>
            </div>
            <p className="text-zinc-300 leading-relaxed">
              {t.rulesSec5Desc}
            </p>
          </div>
        </div>

        {/* Confirmation Button */}
        <div className="mt-4 pt-3.5 border-t border-zinc-850 shrink-0">
          <button
            onClick={handleUnderstand}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-display font-black text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(245,158,11,0.4)] transition transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer animate-pulse"
          >
            <CheckCircle className="w-5 h-5 text-black" />
            <span>{t.rulesUnderstandBtn}</span>
          </button>
          {isMandatory && (
            <p className="text-[10px] font-mono text-zinc-500 text-center mt-2">
              {t.rulesMandatoryNotice}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
