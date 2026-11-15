import React, { useState } from 'react';
import { Gift, Sparkles, Ticket, CheckCircle2, AlertCircle, X, Coins, Clock } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { getLocalized } from '../utils/translations';
import confetti from 'canvas-confetti';

export default function DailyCrateModal({ user, socket, onClose, onUserUpdated, lang = 'ru' }) {
  const [isOpening, setIsOpening] = useState(false);
  const [crateResult, setCrateResult] = useState(null);
  const [crateError, setCrateError] = useState('');

  const [promoCode, setPromoCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [promoStatus, setPromoStatus] = useState(null);

  const now = Date.now();
  const lastClaim = user?.lastDailyClaim || 0;
  const cooldownMs = 24 * 60 * 60 * 1000;
  const canClaimNow = now - lastClaim >= cooldownMs;
  const remainingMs = Math.max(0, cooldownMs - (now - lastClaim));
  const remHours = Math.floor(remainingMs / (60 * 60 * 1000));
  const remMins = Math.ceil((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

  const handleOpenCrate = () => {
    if (!user?.username || isOpening) return;
    setIsOpening(true);
    setCrateError('');
    setCrateResult(null);
    soundManager.playBeep(650, 0.08);

    setTimeout(() => {
      socket.emit('claimDailyCrate', { username: user.username }, (res) => {
        setIsOpening(false);
        if (res?.error) {
          setCrateError(res.error);
          soundManager.playBeep(350, 0.15);
          return;
        }
        if (res?.success) {
          soundManager.playVictory();
          confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
          setCrateResult(res);
          if (res.user && onUserUpdated) {
            onUserUpdated(res.user);
          }
        }
      });
    }, 1100);
  };

  const handleRedeemPromo = (e) => {
    e.preventDefault();
    if (!user?.username || !promoCode.trim() || isRedeeming) return;
    setIsRedeeming(true);
    setPromoStatus(null);
    soundManager.playBeep(800, 0.06);

    socket.emit('redeemPromoCode', { username: user.username, code: promoCode.trim() }, (res) => {
      setIsRedeeming(false);
      if (res?.error) {
        setPromoStatus({ type: 'error', text: res.error });
        soundManager.playBeep(350, 0.15);
        return;
      }
      if (res?.success) {
        soundManager.playVictory();
        confetti({ particleCount: 80, spread: 65, origin: { y: 0.6 } });
        setPromoStatus({ type: 'success', text: res.message });
        setPromoCode('');
        if (res.user && onUserUpdated) {
          onUserUpdated(res.user);
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-950 border-2 border-amber-500/70 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] text-white relative max-h-[92vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-display font-black tracking-wide text-amber-400 uppercase">
                {lang === 'uz' ? "HARBIY TA'MINOT QUTISI VA PROMOKOD" : lang === 'en' ? 'SUPPLY CRATE & PROMO CODES' : '🎁 ВОЕННЫЙ ЯЩИК И ПРОМОКОДЫ'}
              </h2>
              <p className="text-[11px] font-mono text-zinc-400">
                {lang === 'uz' ? "Har kuni 2500 tangagacha yutib oling!" : lang === 'en' ? 'Win up to 2500 BunCoins every 24h!' : 'Открывайте ящик раз в 24 часа и активируйте секретные коды!'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Daily Military Supply Crate */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/30 border border-amber-500/40 text-center space-y-3">
          <div className={`w-20 h-20 mx-auto rounded-3xl bg-amber-500/15 border-2 border-amber-400 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(245,158,11,0.3)] ${isOpening ? 'animate-spin' : 'animate-bounce'}`}>
            📦
          </div>

          <div>
            <div className="text-sm sm:text-base font-display font-extrabold text-white">
              {lang === 'uz' ? "Kunlik Harbiy Quti (150 — 2500 🪙)" : lang === 'en' ? 'Daily Military Supply Crate (150 — 2500 🪙)' : 'Военный Ящик Снабжения (от 200 до 2500 🪙)'}
            </div>
            <div className="text-xs font-mono text-zinc-400 mt-0.5">
              {lang === 'uz' ? "Ichida: 200, 350, 500, 800, 1200 yoki JEKPOT 2500 BunCoins!" : lang === 'en' ? 'Contains: 200, 350, 500, 800, 1200 or JACKPOT 2500 BunCoins!' : 'Внутри: Армейский паёк, Аптечка, Золотой фильтр или ДЖЕКПОТ 2500 🪙!'}
            </div>
          </div>

          {crateResult && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/70 text-emerald-300 font-mono text-xs sm:text-sm font-bold animate-fadeIn">
              🎉 {getLocalized(crateResult.prizeLabel, lang)}
            </div>
          )}

          {crateError && (
            <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-700/60 text-red-300 font-mono text-xs">
              ⏳ {crateError}
            </div>
          )}

          {canClaimNow ? (
            <button
              onClick={handleOpenCrate}
              disabled={isOpening}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-display font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/25 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isOpening
                  ? (lang === 'uz' ? 'Quti ochilmoqda...' : lang === 'en' ? 'Opening crate...' : 'Вскрываем замки ящика...')
                  : (lang === 'uz' ? '🔓 HARBIY QUTINI OCHISH' : lang === 'en' ? '🔓 OPEN SUPPLY CRATE' : '🔓 ВСКРЫТЬ ВОЕННЫЙ ЯЩИК')}
              </span>
            </button>
          ) : (
            <div className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-xs flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>
                {lang === 'uz'
                  ? `Keyingi quti: ${remHours} soat ${remMins} daqiqadan so'ng`
                  : lang === 'en'
                  ? `Next crate available in: ${remHours}h ${remMins}m`
                  : `Следующий ящик через: ${remHours} ч. ${remMins} мин.`}
              </span>
            </div>
          )}
        </div>

        {/* 2. Promo Code Redemption */}
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
            <Ticket className="w-4 h-4" />
            <span>{lang === 'uz' ? 'Maxfiy Promokodni kiriting:' : lang === 'en' ? 'Redeem Secret Promo Code:' : '🎟️ Ввести секретный промокод:'}</span>
          </div>

          <form onSubmit={handleRedeemPromo} className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder={lang === 'uz' ? 'Masalan: BUNKER2026' : lang === 'en' ? 'Enter promo code...' : 'Введите промокод...'}
              className="flex-1 bg-zinc-950 border border-zinc-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold text-white uppercase placeholder-zinc-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!promoCode.trim() || isRedeeming}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-display font-bold text-xs uppercase transition cursor-pointer shrink-0"
            >
              {lang === 'uz' ? 'Faollashtirish' : lang === 'en' ? 'Redeem' : 'Активировать'}
            </button>
          </form>

          {promoStatus && (
            <div className={`p-2.5 rounded-xl text-xs font-mono flex items-center gap-2 ${
              promoStatus.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-600/60 text-emerald-300'
                : 'bg-red-950/60 border border-red-700/60 text-red-300'
            }`}>
              {promoStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{promoStatus.text}</span>
            </div>
          )}
        </div>

        {/* Balance Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{lang === 'uz' ? 'Sizning balansingiz:' : lang === 'en' ? 'Your balance:' : 'Ваш баланс:'}</span>
            <strong className="text-amber-400 text-sm">{user?.bunCoins || 0} 🪙</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-bold cursor-pointer"
          >
            {lang === 'uz' ? 'Yopish' : lang === 'en' ? 'Close' : 'Закрыть'}
          </button>
        </div>
      </div>
    </div>
  );
}
