import React, { useState, useEffect, useRef } from 'react';
import { Skull, FastForward, ShieldAlert, AlertTriangle, Radio, Flame, Wind } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { getLocalized } from '../utils/translations';
import CharacterAvatar from './CharacterAvatar';

export default function AmongUsEjectionScreen({ 
  exiledPlayer, 
  roomState, 
  onComplete, 
  lang = 'ru' 
}) {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState('doors'); // 'doors' -> 'falling' -> 'verdict'
  const [typedLine1, setTypedLine1] = useState('');
  const [typedLine2, setTypedLine2] = useState('');
  const [typedLine3, setTypedLine3] = useState('');
  const [showStamp, setShowStamp] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [screenShake, setScreenShake] = useState(false);

  // Находим карточку профессии изгнанного игрока
  const fullPlayer = (roomState?.players || []).find(p => p.id === exiledPlayer?.id);
  const professionCard = fullPlayer?.deck?.find(c => c.id === 'profession' || c.type === 'profession');
  const professionVal = professionCard 
    ? (getLocalized(professionCard.value, lang) || getLocalized(professionCard.title, lang) || getLocalized(professionCard.name, lang))
    : '';
  const professionTitle = professionVal && professionVal !== '[object Object]'
    ? professionVal
    : (lang === 'uz' ? 'Noma\'lum kasb' : lang === 'en' ? 'Unknown Profession' : 'Неизвестная профессия');

  const aliveRemaining = (roomState?.players || []).filter(p => p.isAlive && p.id !== exiledPlayer?.id).length;
  const capacity = roomState?.bunkerCapacity || 2;

  const line1 = exiledPlayer
    ? (lang === 'uz' 
        ? `«${exiledPlayer.name}» Bunkerdan haydaldi.` 
        : lang === 'en' 
        ? `«${exiledPlayer.name}» was ejected into the Wasteland.` 
        : `«${exiledPlayer.name}» был изгнан в радиоактивную пустошь.`)
    : (lang === 'uz'
        ? 'Ovozlar teng keldi. Hech kim haydalmadi.'
        : lang === 'en'
        ? 'Votes tied. No one was ejected.'
        : 'Голоса разделились поровну. Никто не был изгнан.');

  const line2 = exiledPlayer
    ? (lang === 'uz'
        ? `Uning mutaxassisligi: ${professionTitle}.`
        : lang === 'en'
        ? `Confirmed profession: ${professionTitle}.`
        : `Подтвержденная профессия: ${professionTitle}.`)
    : '';

  const line3 = (lang === 'uz'
    ? `Tirik qolganlar: ${aliveRemaining} / 12  •  Bunkerda joylar: ${capacity}`
    : lang === 'en'
    ? `Survivors remaining: ${aliveRemaining} / 12  •  Bunker capacity: ${capacity}`
    : `Выживших претендентов: ${aliveRemaining} из 12  •  Мест в бункере: ${capacity}`);

  // ===================== REALISTIC CANVAS PARTICLE & STORM ENGINE =====================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // 180+ физических частиц: раскаленные искры, хлопья радиоактивного пепла, пар
    const particles = [];
    const PARTICLE_COUNT = 160;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2.8 + 0.6,
        color: Math.random() > 0.4 
          ? `rgba(255, ${Math.floor(Math.random() * 120 + 70)}, 10, ${Math.random() * 0.7 + 0.3})`
          : `rgba(255, ${Math.floor(Math.random() * 50 + 20)}, 20, ${Math.random() * 0.8 + 0.2})`,
        vx: (Math.random() - 0.5) * 4 - 3, // Сильный ураганный ветер справа налево
        vy: Math.random() * 2.5 - 1.2,
        life: Math.random() * 100,
        maxLife: 100 + Math.random() * 80,
        pulse: Math.random() * Math.PI
      });
    }

    // Всполохи молний в токсичном небе
    let lightningTimer = 0;
    let lightningActive = false;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Фоновое зловещее зарево магмы и радиации снизу
      const bottomGlow = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - 350);
      bottomGlow.addColorStop(0, 'rgba(220, 38, 38, 0.45)');
      bottomGlow.addColorStop(0.4, 'rgba(245, 158, 11, 0.18)');
      bottomGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bottomGlow;
      ctx.fillRect(0, canvas.height - 350, canvas.width, 350);

      // Вспышка токсичной молнии
      lightningTimer++;
      if (lightningTimer > 110 && Math.random() > 0.94) {
        lightningActive = true;
        lightningTimer = 0;
        setTimeout(() => { lightningActive = false; }, 90);
      }
      if (lightningActive) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Отрисовка летящих искр и пепла
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.pulse += 0.08;

        if (p.x < -20) p.x = canvas.width + 20;
        if (p.x > canvas.width + 20) p.x = -20;
        if (p.y < -20) p.y = canvas.height + 20;
        if (p.y > canvas.height + 20) p.y = -20;

        const alpha = Math.sin(p.pulse) * 0.3 + 0.7;
        ctx.save();
        ctx.globalAlpha = Math.max(0.1, alpha);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // ===================== CINEMATIC TIMELINE & AUDIO ORCHESTRATION =====================
  useEffect(() => {
    // 1. Старт: грохот разгерметизации шлюза и аварийные сирены
    soundManager.playAirlockSlam();
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 900);

    // 2. Фаза открытия шлюза и выталкивания в пустошь
    const tDoors = setTimeout(() => {
      setPhase('falling');
    }, 1100);

    // 3. Фаза вердикта и эффект печатной машинки
    const tVerdict = setTimeout(() => {
      setPhase('verdict');

      let idx1 = 0;
      const int1 = setInterval(() => {
        idx1++;
        setTypedLine1(line1.substring(0, idx1));
        if (idx1 >= line1.length) {
          clearInterval(int1);

          setTimeout(() => {
            let idx2 = 0;
            const int2 = setInterval(() => {
              idx2++;
              setTypedLine2(line2.substring(0, idx2));
              if (idx2 >= line2.length) {
                clearInterval(int2);

                setTimeout(() => {
                  let idx3 = 0;
                  const int3 = setInterval(() => {
                    idx3++;
                    setTypedLine3(line3.substring(0, idx3));
                    if (idx3 >= line3.length) {
                      clearInterval(int3);

                      // Удар красного штампа ликвидации
                      setTimeout(() => {
                        setShowStamp(true);
                        soundManager.playStampSlam();
                        setScreenShake(true);
                        setTimeout(() => setScreenShake(false), 400);
                        setShowButton(true);
                      }, 250);
                    }
                  }, 20);
                }, 200);
              }
            }, 25);
          }, 300);
        }
      }, 35);
    }, 2800);

    // 4. Автоматический переход
    const autoTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 8000);

    return () => {
      clearTimeout(tDoors);
      clearTimeout(tVerdict);
      clearTimeout(autoTimer);
    };
  }, []);

  return (
    <div className={`fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-3 sm:p-6 overflow-hidden select-none transition-transform duration-100 ${
      screenShake ? 'animate-[shake_0.4s_ease-in-out]' : ''
    }`}>
      {/* Particle & Lighting Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Emergency Rotating Red Alarm Lights in the background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140vw] h-[140vw] max-w-[1200px] max-h-[1200px] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(220,38,38,0.25)_45deg,transparent_90deg,rgba(245,158,11,0.25)_225deg,transparent_270deg)] animate-[spin_8s_linear_infinite]" />
      </div>

      {/* Military Sci-Fi Scanlines Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.6)_50%)] bg-[length:100%_4px] pointer-events-none z-10 opacity-70" />

      {/* Top Military HUD Status Bar */}
      <div className="absolute top-3 left-4 right-4 z-30 flex items-center justify-between text-[10px] sm:text-xs font-mono">
        <div className="flex items-center gap-2 bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-red-900/60 text-red-400">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
          <span className="font-bold tracking-widest uppercase">
            {lang === 'uz' ? "[ QUVG'IN PROTOKOLI // №7 LYUK BOSIMSIZLANDI ]" : lang === 'en' ? '[ EJECTION PROTOCOL // AIRLOCK #7 DEPRESSURIZED ]' : '[ ПРОТОКОЛ ИЗГНАНИЯ // ГЕРМОШЛЮЗ №7 РАЗГЕРМЕТИЗИРОВАН ]'}
          </span>
        </div>

        {/* Skip button */}
        <button
          onClick={() => {
            soundManager.playBeep(800, 0.05);
            if (onComplete) onComplete();
          }}
          className="px-3.5 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-lg hover:border-amber-500"
        >
          <span>{lang === 'uz' ? "O'tkazib yuborish" : lang === 'en' ? 'Skip' : 'Пропустить'}</span>
          <FastForward className="w-3.5 h-3.5 text-amber-400" />
        </button>
      </div>

      {/* ===================== MASSIVE HEAVY STEEL BLAST DOORS ===================== */}
      <div className="absolute inset-0 pointer-events-none z-20 flex">
        {/* Left Blast Door */}
        <div className={`w-1/2 h-full bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-800 border-r-4 border-amber-500/80 shadow-[inset_0_0_80px_rgba(0,0,0,0.9)] flex items-center justify-end pr-4 transition-transform duration-1000 ease-out ${
          phase !== 'doors' ? '-translate-x-full' : 'translate-x-0'
        }`}>
          {/* Hydraulic gear stripes */}
          <div className="flex flex-col items-center gap-8 opacity-40">
            <div className="w-6 h-40 bg-[repeating-linear-gradient(45deg,#000,#000_15px,#f59e0b_15px,#f59e0b_30px)] rounded border border-amber-600" />
            <div className="w-12 h-12 rounded-full border-4 border-dashed border-zinc-600 animate-spin" />
          </div>
        </div>

        {/* Right Blast Door */}
        <div className={`w-1/2 h-full bg-gradient-to-l from-zinc-950 via-zinc-900 to-zinc-800 border-l-4 border-amber-500/80 shadow-[inset_0_0_80px_rgba(0,0,0,0.9)] flex items-center justify-start pl-4 transition-transform duration-1000 ease-out ${
          phase !== 'doors' ? 'translate-x-full' : 'translate-x-0'
        }`}>
          <div className="flex flex-col items-center gap-8 opacity-40">
            <div className="w-6 h-40 bg-[repeating-linear-gradient(-45deg,#000,#000_15px,#f59e0b_15px,#f59e0b_30px)] rounded border border-amber-600" />
            <div className="w-12 h-12 rounded-full border-4 border-dashed border-zinc-600 animate-spin" />
          </div>
        </div>
      </div>

      {/* ===================== THE REALISTIC 3D FALLING CHARACTER ===================== */}
      {exiledPlayer && (
        <div className="relative z-10 w-full max-w-2xl h-52 sm:h-64 flex items-center justify-center [perspective:1400px]">
          {/* Tumbling 3D Character Card falling into the fiery void */}
          <div className="animate-[realisticPlummet_5s_cubic-bezier(0.15,0.85,0.35,1)_forwards] flex flex-col items-center [transform-style:preserve-3d]">
            {/* Dying radio speech bubble */}
            <div className="mb-3 px-3.5 py-1.5 rounded-2xl bg-zinc-950/95 border-2 border-red-500/80 text-[11px] sm:text-xs font-mono font-bold text-red-300 shadow-[0_0_25px_rgba(239,68,68,0.5)] whitespace-nowrap animate-pulse flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-red-500 animate-ping" />
              <span>
                {lang === 'uz' 
                  ? "«Gidrozatvor yopilyapti!... Yo'q!...»" 
                  : lang === 'en' 
                  ? "«Airlock sealed!... Noooo!...»" 
                  : "«Шлюз запечатан!... Неееет!...»"}
              </span>
            </div>

            {/* Holographic Tactical Avatar Box with Flames & Electric Arc */}
            <div className="relative p-3 rounded-3xl bg-zinc-950/90 border-2 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.7)] backdrop-blur-md">
              <CharacterAvatar 
                character={fullPlayer?.character || exiledPlayer.character} 
                size="hero" 
                isAlive={false} 
                lang={lang} 
              />

              {/* Biohazard Death Skull Overlay */}
              <div className="absolute -top-3 -right-3 w-10 h-10 rounded-2xl bg-red-600 border-2 border-white text-white flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.9)] animate-bounce">
                <Skull className="w-6 h-6" />
              </div>

              {/* Holographic static interference lines */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/10 to-transparent animate-pulse rounded-3xl pointer-events-none" />
            </div>

            {/* Glowing Name & Connection Lost warning */}
            <div className="mt-2 text-center">
              <div className="text-sm sm:text-base font-display font-extrabold text-white tracking-widest drop-shadow-[0_0_12px_rgba(239,68,68,0.9)]">
                {exiledPlayer.name}
              </div>
              <div className="text-[10px] font-mono text-red-400 font-bold tracking-wider flex items-center justify-center gap-1">
                <span>{lang === 'uz' ? "[ ALOQA YO'QOLDI // 0% SIGNAL ]" : lang === 'en' ? '[ SIGNAL LOST // 0% SIGNAL ]' : '[ СВЯЗЬ ПОТЕРЯНА // 0% СИГНАЛ ]'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== CINEMATIC TYPEWRITER MILITARY DOSSIER ===================== */}
      <div className="relative z-30 max-w-2xl w-full text-center px-4 space-y-3 mt-4">
        {/* Terminal Header */}
        <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest flex items-center justify-center gap-2">
          <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span>{lang === 'uz' ? "ATMOSFERA: RADIATSIYALI BO'RON (-76°C // 14,500 mZv/s)" : lang === 'en' ? 'ATMOSPHERE: RADIATION STORM (-76°C // 14,500 mSv/h)' : 'АТМОСФЕРА: РАДИАЦИОННЫЙ УРАГАН (-76°C // 14,500 мЗв/ч)'}</span>
          <Wind className="w-3.5 h-3.5 text-red-500 animate-pulse" />
        </div>

        {/* Line 1: Exiled Announcement */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-black tracking-wider text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.6)] min-h-[2.5rem]">
          {typedLine1}
          {typedLine1.length < line1.length && (
            <span className="inline-block w-3 h-6 bg-red-500 ml-1 animate-ping align-middle" />
          )}
        </h1>

        {/* Line 2: Profession Reveal */}
        {line2 && (
          <p className="text-sm sm:text-base md:text-lg font-mono font-bold text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)] min-h-[1.75rem]">
            {typedLine2}
            {typedLine1.length >= line1.length && typedLine2.length < line2.length && (
              <span className="inline-block w-2.5 h-5 bg-amber-400 ml-1 animate-pulse align-middle" />
            )}
          </p>
        )}

        {/* Line 3: Living Survivors count vs Bunker Capacity */}
        <p className="text-xs sm:text-sm font-mono text-zinc-300 min-h-[1.5rem] tracking-wide">
          {typedLine3}
          {typedLine2.length >= line2.length && typedLine3.length < line3.length && (
            <span className="inline-block w-2 h-4 bg-zinc-300 ml-1 animate-pulse align-middle" />
          )}
        </p>

        {/* ===================== VIOLENT SLAM STAMP ===================== */}
        {showStamp && (
          <div className="pt-2 animate-[stampSlam_0.25s_cubic-bezier(0.18,0.89,0.32,1.28)_forwards]">
            <div className="inline-block px-6 py-2.5 bg-red-700/90 text-white font-mono font-black text-base sm:text-xl uppercase tracking-widest rounded-2xl border-2 border-red-400 shadow-[0_0_40px_rgba(239,68,68,0.9)] rotate-[-2deg]">
              ☣️ {lang === 'uz' ? 'QAYTIB BO\'LMAS DARAJADA HAYDALDI' : lang === 'en' ? 'PERMANENTLY EJECTED' : 'ЛИКВИДИРОВАН // ИЗГНАН В ПУСТОШЬ'} ☣️
            </div>
          </div>
        )}

        {/* Continue Button */}
        {showButton && (
          <div className="pt-4 animate-fadeIn">
            <button
              onClick={() => {
                soundManager.playBeep(900, 0.05);
                if (onComplete) onComplete();
              }}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-display font-black text-sm sm:text-base tracking-wider shadow-[0_0_35px_rgba(245,158,11,0.6)] border-2 border-amber-200 transition-all hover:scale-105 active:scale-95 cursor-pointer animate-pulse"
            >
              <span>{lang === 'uz' ? "Batafsil natijalar ➔" : lang === 'en' ? "View Vote Breakdown ➔" : "Подробные итоги голосования ➔"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Cinematic Custom Keyframes */}
      <style>{`
        @keyframes realisticPlummet {
          0% {
            transform: translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1.15);
            opacity: 1;
            filter: drop-shadow(0 0 25px rgba(239,68,68,0.8));
          }
          30% {
            transform: translate3d(-60px, 30px, -200px) rotateX(35deg) rotateY(-45deg) rotateZ(15deg) scale(0.95);
            opacity: 0.95;
          }
          65% {
            transform: translate3d(120px, 90px, -600px) rotateX(110deg) rotateY(180deg) rotateZ(85deg) scale(0.65);
            opacity: 0.7;
            filter: blur(1px) drop-shadow(0 0 15px rgba(239,68,68,0.5));
          }
          100% {
            transform: translate3d(240px, 160px, -1100px) rotateX(240deg) rotateY(380deg) rotateZ(190deg) scale(0.35);
            opacity: 0.15;
            filter: blur(3px);
          }
        }

        @keyframes stampSlam {
          0% {
            transform: scale(2.8) rotate(-15deg);
            opacity: 0;
          }
          100% {
            transform: scale(1) rotate(-2deg);
            opacity: 1;
          }
        }

        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          15% { transform: translate(-8px, 6px); }
          30% { transform: translate(7px, -5px); }
          45% { transform: translate(-6px, 4px); }
          60% { transform: translate(5px, -3px); }
          75% { transform: translate(-3px, 2px); }
        }
      `}</style>
    </div>
  );
}
