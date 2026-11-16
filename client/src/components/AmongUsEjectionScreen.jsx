import React, { useState, useEffect } from 'react';
import { Skull, Volume2, FastForward, ShieldAlert } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { getLocalized } from '../utils/translations';
import CharacterAvatar from './CharacterAvatar';

export default function AmongUsEjectionScreen({ 
  exiledPlayer, 
  roomState, 
  onComplete, 
  lang = 'ru' 
}) {
  const [typedText1, setTypedText1] = useState('');
  const [typedText2, setTypedText2] = useState('');
  const [typedText3, setTypedText3] = useState('');
  const [showButton, setShowButton] = useState(false);

  // Находим карточку профессии изгнанного игрока
  const fullPlayer = (roomState?.players || []).find(p => p.id === exiledPlayer?.id);
  const professionCard = fullPlayer?.deck?.find(c => c.id === 'profession' || c.type === 'profession');
  const professionTitle = professionCard 
    ? (getLocalized(professionCard.title, lang) || professionCard.name || professionCard.title)
    : (lang === 'uz' ? 'Noma\'lum kasb' : lang === 'en' ? 'Unknown Profession' : 'Неизвестная профессия');

  const aliveRemaining = (roomState?.players || []).filter(p => p.isAlive && p.id !== exiledPlayer?.id).length;
  const capacity = roomState?.bunkerCapacity || 2;

  // Тексты в стиле Among Us
  const line1 = exiledPlayer
    ? (lang === 'uz' 
        ? `${exiledPlayer.name} Bunkerdan haydaldi.` 
        : lang === 'en' 
        ? `${exiledPlayer.name} was ejected from the Bunker.` 
        : `«${exiledPlayer.name}» был изгнан из Бункера.`)
    : (lang === 'uz'
        ? 'Ovozlar teng keldi. Hech kim haydvalmadi.'
        : lang === 'en'
        ? 'No one was ejected. (Tie).'
        : 'Голоса разделились поровну. Никто не был изгнан.');

  const line2 = exiledPlayer
    ? (lang === 'uz'
        ? `Uning kasbi edi: ${professionTitle}.`
        : lang === 'en'
        ? `Their profession was: ${professionTitle}.`
        : `Его профессия была: ${professionTitle}.`)
    : '';

  const line3 = (lang === 'uz'
    ? `${aliveRemaining} ta omon qoluvchi qoldi. Bunkerda joylar: ${capacity}.`
    : lang === 'en'
    ? `${aliveRemaining} survivors remain. Bunker spots: ${capacity}.`
    : `В живых осталось: ${aliveRemaining}. Мест в бункере: ${capacity}.`);

  useEffect(() => {
    // Звуковой эффект драматического изгнания
    soundManager.playAlarm();

    // Эффект печатной машинки
    let idx1 = 0;
    const interval1 = setInterval(() => {
      idx1++;
      setTypedText1(line1.substring(0, idx1));
      if (idx1 >= line1.length) {
        clearInterval(interval1);

        if (line2) {
          setTimeout(() => {
            let idx2 = 0;
            const interval2 = setInterval(() => {
              idx2++;
              setTypedText2(line2.substring(0, idx2));
              if (idx2 >= line2.length) {
                clearInterval(interval2);

                setTimeout(() => {
                  let idx3 = 0;
                  const interval3 = setInterval(() => {
                    idx3++;
                    setTypedText3(line3.substring(0, idx3));
                    if (idx3 >= line3.length) {
                      clearInterval(interval3);
                      setShowButton(true);
                    }
                  }, 25);
                }, 300);
              }
            }, 30);
          }, 350);
        } else {
          setShowButton(true);
        }
      }
    }, 45);

    // Автоматический переход через 6.5 секунд
    const autoTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 6500);

    return () => {
      clearInterval(interval1);
      clearTimeout(autoTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4 overflow-hidden select-none animate-fadeIn">
      {/* Dynamic Starfield / Apocalyptic Ash particle background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-950 via-black to-black">
        {/* Floating background star dots */}
        <div className="absolute w-1 h-1 bg-white/60 rounded-full top-[15%] left-[20%] animate-ping" />
        <div className="absolute w-1.5 h-1.5 bg-amber-400/50 rounded-full top-[35%] left-[75%] animate-pulse" />
        <div className="absolute w-1 h-1 bg-red-400/40 rounded-full top-[70%] left-[10%] animate-ping" />
        <div className="absolute w-2 h-2 bg-purple-400/30 rounded-full top-[85%] left-[80%] animate-pulse" />
        <div className="absolute w-1 h-1 bg-white/70 rounded-full top-[25%] left-[85%]" />
        <div className="absolute w-1 h-1 bg-white/50 rounded-full top-[60%] left-[45%]" />
      </div>

      {/* Volcanic Lava / Radiation Hazard Glow from Bottom */}
      <div className="absolute -bottom-20 left-0 right-0 h-48 bg-gradient-to-t from-red-600/40 via-amber-600/20 to-transparent blur-2xl pointer-events-none" />

      {/* Skip Button Top-Right */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => {
            soundManager.playBeep(800, 0.05);
            if (onComplete) onComplete();
          }}
          className="px-3 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700/80 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-lg"
        >
          <span>{lang === 'uz' ? "O'tkazib yuborish" : lang === 'en' ? 'Skip' : 'Пропустить'}</span>
          <FastForward className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Falling / Ejecting Character Animation */}
      {exiledPlayer && (
        <div className="relative w-full max-w-2xl h-44 sm:h-56 mb-6 flex items-center justify-center">
          {/* Animated ejected avatar floating diagonally across space */}
          <div className="absolute animate-[amongUsEject_6s_cubic-bezier(0.25,1,0.5,1)_forwards] flex flex-col items-center">
            {/* Speech bubble */}
            <div className="mb-2 px-3 py-1 rounded-xl bg-zinc-900/90 border border-amber-500/50 text-[11px] font-mono text-amber-300 shadow-lg whitespace-nowrap animate-bounce">
              {lang === 'uz' 
                ? "Bunker mening uyim edi!..." 
                : lang === 'en' 
                ? "I was innocent!..." 
                : "Нееет! Бункер был моим шансом..."}
            </div>

            <div className="relative">
              <CharacterAvatar 
                character={fullPlayer?.character || exiledPlayer.character} 
                size="lg" 
                isAlive={false} 
                lang={lang} 
              />
              <div className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1 shadow-lg shadow-red-600/60 animate-ping">
                <Skull className="w-3 h-3" />
              </div>
            </div>

            <span className="mt-1.5 text-xs font-mono font-bold text-red-400 tracking-wider">
              {exiledPlayer.name}
            </span>
          </div>
        </div>
      )}

      {/* Iconic Typewriter Text Box (Among Us Style) */}
      <div className="relative z-10 max-w-xl w-full text-center px-4 space-y-3">
        {/* Line 1: Player Ejected */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-mono font-black tracking-wider text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] min-h-[2.5rem]">
          {typedText1}
          {typedText1.length < line1.length && (
            <span className="inline-block w-2.5 h-6 bg-red-500 ml-1 animate-pulse align-middle" />
          )}
        </h1>

        {/* Line 2: Role / Profession Revealed */}
        {line2 && (
          <p className="text-sm sm:text-base md:text-lg font-mono font-bold text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] min-h-[1.75rem]">
            {typedText2}
            {typedText1.length >= line1.length && typedText2.length < line2.length && (
              <span className="inline-block w-2 h-5 bg-amber-400 ml-1 animate-pulse align-middle" />
            )}
          </p>
        )}

        {/* Line 3: Survivors Remaining */}
        <p className="text-xs sm:text-sm font-mono text-zinc-400 min-h-[1.5rem] tracking-wide">
          {typedText3}
          {typedText2.length >= line2.length && typedText3.length < line3.length && (
            <span className="inline-block w-2 h-4 bg-zinc-400 ml-1 animate-pulse align-middle" />
          )}
        </p>

        {/* Continue Button */}
        {showButton && (
          <div className="pt-4 animate-fadeIn">
            <button
              onClick={() => {
                soundManager.playBeep(900, 0.05);
                if (onComplete) onComplete();
              }}
              className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-display font-extrabold text-sm tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-amber-300 transition-all hover:scale-105 cursor-pointer animate-pulse"
            >
              <span>{lang === 'uz' ? "Davom etish (Natijalar) ➔" : lang === 'en' ? "Continue (Results) ➔" : "Подробные итоги раунда ➔"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Keyframe for Among Us ejection drift */}
      <style>{`
        @keyframes amongUsEject {
          0% {
            transform: translate(-140px, -30px) rotate(0deg) scale(1.1);
            opacity: 1;
          }
          50% {
            transform: translate(20px, 10px) rotate(180deg) scale(0.95);
            opacity: 1;
          }
          100% {
            transform: translate(160px, 70px) rotate(420deg) scale(0.65);
            opacity: 0.15;
          }
        }
      `}</style>
    </div>
  );
}
