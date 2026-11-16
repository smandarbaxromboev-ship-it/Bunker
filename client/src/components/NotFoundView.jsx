import React, { useState, useEffect } from 'react';
import { ShieldAlert, Radio, Radar, ArrowLeft, Terminal, Skull, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import { soundManager } from '../utils/audio';
import BunkerLogo from './BunkerLogo';
import AtmosphereEffects from './AtmosphereEffects';

const WASTELAND_FINDS = {
  ru: [
    '🥫 В руинах сектора найдена банка армейской тушёнки 2024 года!',
    '☢️ Счётчик Гейгера зашкаливает: рядом обнаружен радиоактивный гусь!',
    '📟 Перехвачен зашифрованный радиосигнал из соседнего Бункера #7!',
    '🛡️ Вы нашли брошенный фильтр противогаза и старую карту метро.',
    '💀 В этом секторе остались только пепел и запертые гермодвери...',
    '⚡ Обнаружен резервный генератор, но кабель перегрызли мутанты!'
  ],
  uz: [
    "🥫 Xarobalardan 2024-yilgi harbiy konserva topildi!",
    "☢️ Geyger hisoblagichi qichqirmoqda: yaqin atrofda radioaktiv g'oz bor!",
    "📟 Qo'shni #7 Bunkerdan maxfiy radiosignal tutib olindi!",
    "🛡️ Tashlab ketilgan protivogaz filtri va eski xarita topildi.",
    "💀 Bu sektorda faqat kul va yopiq germetik eshiklar qolgan...",
    "⚡ Zaxira generatori topildi, lekin simlarini mutantlar uzib tashlagan!"
  ],
  en: [
    '🥫 Found an intact 2024 military ration can in the sector ruins!',
    '☢️ Geiger counter spiking: a radioactive mutant goose is nearby!',
    '📟 Intercepted an encrypted radio transmission from Bunker #7!',
    '🛡️ Found a discarded gas mask filter and a faded metro map.',
    '💀 Only ash and sealed blast doors remain in this sector...',
    '⚡ Found a backup generator, but mutants chewed through the cables!'
  ]
};

export default function NotFoundView({ currentPath = '/404', onBackHome, lang = 'ru' }) {
  const [radiation, setRadiation] = useState(404.2);
  const [scanResult, setScanResult] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [typedLines, setTypedLines] = useState(1);

  useEffect(() => {
    const radInterval = setInterval(() => {
      setRadiation((prev) => {
        const delta = (Math.random() - 0.48) * 1.4;
        return Number(Math.max(399.1, Math.min(419.9, prev + delta)).toFixed(1));
      });
    }, 900);

    const logTimer = setInterval(() => {
      setTypedLines((prev) => (prev < 5 ? prev + 1 : prev));
    }, 450);

    return () => {
      clearInterval(radInterval);
      clearInterval(logTimer);
    };
  }, []);

  const handleScanWasteland = () => {
    if (isScanning) return;
    setIsScanning(true);
    soundManager.playBeep(950, 0.07);
    setTimeout(() => {
      soundManager.playBeep(1200, 0.1);
      const list = WASTELAND_FINDS[lang] || WASTELAND_FINDS.ru;
      const randomFind = list[Math.floor(Math.random() * list.length)];
      setScanResult(randomFind);
      setIsScanning(false);
    }, 700);
  };

  const handleEvacuate = () => {
    soundManager.playAlarm();
    if (onBackHome) onBackHome();
  };

  return (
    <div className="min-h-[100dvh] bg-zinc-950 text-zinc-100 flex flex-col justify-between p-3 sm:p-6 relative overflow-hidden select-none">
      {/* Ambient Apocalyptic Ash & Radiation Glow */}
      <AtmosphereEffects enabled={true} lang={lang} />

      {/* Top Caution Hazard Tape */}
      <div className="w-full h-3 rounded-full bg-[repeating-linear-gradient(45deg,#f59e0b,#f59e0b_14px,#09090b_14px,#09090b_28px)] opacity-80 shadow-[0_0_20px_rgba(245,158,11,0.4)] relative z-10" />

      {/* Main Content */}
      <main className="max-w-3xl mx-auto w-full my-auto py-6 relative z-10 flex flex-col items-center text-center">
        {/* Top Status Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/80 border border-red-500/60 text-red-400 font-mono text-xs font-bold uppercase tracking-widest mb-4 shadow-[0_0_25px_rgba(239,68,68,0.35)] animate-pulse">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <span>
            {lang === 'uz'
              ? 'XATOLIK 404 • SEKTOR RADIATSIYA BILAN YO‘Q QILINGAN'
              : lang === 'en'
              ? 'ERROR 404 • SECTOR DESTROYED BY RADIATION'
              : 'ОШИБКА 404 • СЕКТОР УНИЧТОЖЕН РАДИАЦИЕЙ'}
          </span>
        </div>

        {/* Radar + Giant 404 Hologram */}
        <div className="relative flex items-center justify-center my-2">
          {/* Animated Radar Circle */}
          <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full border-2 border-amber-500/40 bg-gradient-to-b from-amber-950/30 via-zinc-950 to-red-950/30 flex items-center justify-center relative shadow-[0_0_60px_rgba(245,158,11,0.2)] overflow-hidden">
            {/* Radar Crosshairs */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-px bg-amber-500/20" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="h-full w-px bg-amber-500/20" />
            </div>
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border border-amber-500/25 absolute pointer-events-none" />
            <div className="w-16 h-16 rounded-full border border-red-500/30 absolute pointer-events-none animate-ping" />

            {/* Blinking Red Anomaly Dots */}
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 absolute top-10 right-12 animate-ping" />
            <span className="w-2 h-2 rounded-full bg-amber-400 absolute bottom-12 left-10 animate-pulse" />

            {/* Center 404 Text */}
            <div className="relative z-10 flex flex-col items-center">
              <span className="text-5xl sm:text-7xl font-display font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-amber-500 to-red-600 drop-shadow-[0_0_25px_rgba(245,158,11,0.6)]">
                404
              </span>
              <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest text-amber-400 mt-0.5 px-2 py-0.5 rounded bg-black/60 border border-amber-500/40">
                ☢️ {radiation} R/h
              </span>
            </div>
          </div>
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-xl sm:text-3xl font-display font-black text-white tracking-wide mt-4 uppercase">
          {lang === 'uz'
            ? 'Bunday Bunker Sektori Topilmadi!'
            : lang === 'en'
            ? 'Bunker Coordinates Not Found!'
            : 'Координаты Бункера Не Найдены!'}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 font-mono max-w-xl mt-2 leading-relaxed">
          {lang === 'uz'
            ? "Siz kiritgan manzil yadroviy zarbadan keyin vayron bo'lgan yoki maxfiy germetik eshik bilan yopilgan. Darhol asosiy bunkerga qayting!"
            : lang === 'en'
            ? 'The sector you are looking for was wiped out in the fallout or sealed behind a classified blast door. Evacuate to the main bunker immediately!'
            : 'Сектор, по которому вы перешли, был разрушен после катастрофы или заблокирован герметичным шлюзом. Немедленно эвакуируйтесь в главный бункер!'}
        </p>

        {/* Terminal Diagnostic Box */}
        <div className="w-full max-w-xl mt-5 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-left font-mono text-xs space-y-1.5 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Terminal className="w-3.5 h-3.5" />
              <span>BUNKER-OS // DIAGNOSTIC TERMINAL v7.4</span>
            </span>
            <span className="text-red-400 font-bold">STATUS: LOST_SECTOR</span>
          </div>

          {typedLines >= 1 && (
            <div className="text-zinc-300">
              <span className="text-amber-500 mr-1.5">&gt;</span>
              {lang === 'uz' ? 'Qidirilayotgan manzil:' : lang === 'en' ? 'Target path:' : 'Запрошенный сектор:'}{' '}
              <code className="px-1.5 py-0.5 rounded bg-red-950/80 border border-red-700/60 text-red-300 font-bold break-all">
                {currentPath}
              </code>
            </div>
          )}
          {typedLines >= 2 && (
            <div className="text-emerald-400">
              <span className="text-amber-500 mr-1.5">&gt;</span>
              {lang === 'uz'
                ? "Asosiy server bilan aloqa: BARQAROR [OK]"
                : lang === 'en'
                ? 'Main Bunker Server Uplink: ONLINE [OK]'
                : 'Связь с главным терминалом Бункера: АКТИВНА [OK]'}
            </div>
          )}
          {typedLines >= 3 && (
            <div className="text-red-400">
              <span className="text-amber-500 mr-1.5">&gt;</span>
              {lang === 'uz'
                ? 'Xatolik: Bu koordinatada tirik jon topilmadi (Kod: 404).'
                : lang === 'en'
                ? 'Error: No survivors detected at these coordinates (Code: 404).'
                : 'Ошибка: По данным координатам живых не обнаружено (Код: 404).'}
            </div>
          )}
          {typedLines >= 4 && (
            <div className="text-amber-300">
              <span className="text-amber-500 mr-1.5">&gt;</span>
              {lang === 'uz'
                ? 'Tavsiya: Radiatsiya darajasi oshmoqda — asosiy menyuga qayting!'
                : lang === 'en'
                ? 'Advisory: Radiation rising — return to the main bunker!'
                : 'Рекомендация: Уровень радиации растёт — вернитесь в главный бункер!'}
            </div>
          )}

          {scanResult && (
            <div className="mt-2 pt-2 border-t border-zinc-800 text-cyan-300 font-bold animate-fadeIn">
              {scanResult}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 w-full max-w-xl">
          <button
            type="button"
            onClick={handleEvacuate}
            className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-display font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(245,158,11,0.4)] transition cursor-pointer active:scale-98"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>
              {lang === 'uz'
                ? '🚪 ASOSIY BUNKERGA QAYTISH'
                : lang === 'en'
                ? '🚪 EVACUATE TO MAIN BUNKER'
                : '🚪 ВЕРНУТЬСЯ В ГЛАВНЫЙ БУНКЕР'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleScanWasteland}
            disabled={isScanning}
            className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-cyan-400 border border-cyan-500/40 font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            <span>
              {isScanning
                ? lang === 'uz'
                  ? 'Skanerlanmoqda...'
                  : lang === 'en'
                  ? 'Scanning...'
                  : 'Сканирование...'
                : lang === 'uz'
                ? '📡 Xarobalarni skanerlash'
                : lang === 'en'
                ? '📡 Scan Sector Ruins'
                : '📡 Просканировать руины'}
            </span>
          </button>
        </div>
      </main>

      {/* Bottom Caution Hazard Tape */}
      <div className="w-full h-3 rounded-full bg-[repeating-linear-gradient(45deg,#f59e0b,#f59e0b_14px,#09090b_14px,#09090b_28px)] opacity-80 shadow-[0_0_20px_rgba(245,158,11,0.4)] relative z-10" />
    </div>
  );
}
