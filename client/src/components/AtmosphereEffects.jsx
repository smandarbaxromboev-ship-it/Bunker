import React, { useEffect, useRef, useState } from 'react';
import { translations } from '../utils/translations';

export default function AtmosphereEffects({ enabled = true, lang = 'ru' }) {
  const canvasRef = useRef(null);
  const [radiationSv, setRadiationSv] = useState(4.82);
  const t = translations[lang] || translations.ru;

  // Fluctuating Geiger radiation reading
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      setRadiationSv((prev) => {
        const delta = (Math.random() - 0.48) * 0.35;
        return Number(Math.max(3.2, Math.min(9.9, prev + delta)).toFixed(2));
      });
    }, 1800);
    return () => clearInterval(interval);
  }, [enabled]);

  // Canvas floating radioactive spores, toxic acid rain & fallout sparks
  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // 1. Glowing Fallout Spores
    const sporeCount = 55;
    const spores = [];
    for (let i = 0; i < sporeCount; i++) {
      const type = Math.random();
      spores.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 3.2 + 1.2,
        vx: (Math.random() - 0.5) * 0.7,
        vy: -Math.random() * 1.1 - 0.3,
        alpha: Math.random() * 0.65 + 0.35,
        color: type > 0.55 ? '#84cc16' : type > 0.2 ? '#f59e0b' : '#ef4444'
      });
    }

    // 2. Acid Rain Streaks
    const rainCount = 24;
    const raindrops = [];
    for (let i = 0; i < rainCount; i++) {
      raindrops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        len: Math.random() * 18 + 10,
        vy: Math.random() * 4.5 + 3.5,
        vx: 0.6,
        alpha: Math.random() * 0.35 + 0.15
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Acid Rain
      ctx.lineWidth = 1.2;
      raindrops.forEach(d => {
        d.x += d.vx;
        d.y += d.vy;
        if (d.y > canvas.height) {
          d.y = -20;
          d.x = Math.random() * canvas.width;
        }
        if (d.x > canvas.width) d.x = 0;

        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.vx * 3, d.y + d.len);
        ctx.strokeStyle = `rgba(132, 204, 22, ${d.alpha})`;
        ctx.stroke();
      });

      // Draw Radioactive Spores
      spores.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [enabled]);

  if (!enabled) return null;

  const zombieChants = lang === 'uz'
    ? ['☢️ RADIATSIYA!', '🧟 BUNKERNI OCH!', '🧠 MIYA...', '☣️ VIRUS!']
    : lang === 'en'
    ? ['☢️ RADIATION!', '🧟 OPEN THE BUNKER!', '🧠 BRAINS...', '☣️ BIOHAZARD!']
    : ['☢️ РАДИАЦИЯ!', '🧟 ОТКРОЙТЕ БУНКЕР!', '🧠 МОЗГИ...', '☣️ ЗАРАЖЕНИЕ!'];

  return (
    <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden select-none">
      {/* 1. Canvas Radioactive Spores & Acid Rain */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-85" />

      {/* 2. Glowing Toxic Green & Amber Fog at the Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-28 sm:h-40 bg-gradient-to-t from-lime-500/20 via-amber-500/10 to-transparent blur-xl animate-pulse" />

      {/* 3. Rotating Giant Holographic Biohazard & Radiation Watermarks in Corners */}
      <div className="
        fixed -bottom-16 -right-16 w-64 h-64 sm:w-80 sm:h-80 opacity-20 dark:opacity-25
        text-lime-500 drop-shadow-[0_0_25px_rgba(132,204,22,0.8)]
        animate-[spin_28s_linear_infinite]
      ">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <circle cx="12" cy="12" r="2.5" />
          <path d="M12 9.5a5.5 5.5 0 0 1 4.76 2.75l2.6-1.5A8.5 8.5 0 0 0 12 6.5v3z" />
          <path d="M14.16 13.25a5.5 5.5 0 0 1-4.32 2.5v3a8.5 8.5 0 0 0 6.92-4l-2.6-1.5z" />
          <path d="M9.84 13.25l-2.6 1.5a8.5 8.5 0 0 0 6.92 4v-3a5.5 5.5 0 0 1-4.32-2.5z" transform="rotate(120 12 12)" />
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
        </svg>
      </div>

      {/* 4. Floating Glowing Radiation & Biohazard Symbols Drifting Upwards */}
      <div className="fixed left-[6%] bottom-10 text-xl sm:text-2xl opacity-60 drop-shadow-[0_0_12px_#84cc16] animate-[floatUp_14s_linear_infinite]">
        ☢️
      </div>
      <div className="fixed left-[28%] bottom-6 text-lg sm:text-xl opacity-50 drop-shadow-[0_0_12px_#f59e0b] animate-[floatUp_19s_linear_infinite_4s]">
        ☣️
      </div>
      <div className="fixed right-[22%] bottom-8 text-xl sm:text-2xl opacity-60 drop-shadow-[0_0_12px_#ef4444] animate-[floatUp_16s_linear_infinite_2s]">
        ☢️
      </div>
      <div className="fixed right-[7%] bottom-12 text-lg sm:text-xl opacity-55 drop-shadow-[0_0_12px_#84cc16] animate-[floatUp_21s_linear_infinite_7s]">
        ☣️
      </div>

      {/* 5. Flying Mutated Bats / Crows across Upper Sky */}
      <div className="fixed top-14 left-0 text-lg sm:text-xl opacity-75 drop-shadow-[0_0_10px_#ef4444] animate-[flyAcross_22s_linear_infinite]">
        🦇
      </div>
      <div className="fixed top-24 left-0 text-base sm:text-lg opacity-65 drop-shadow-[0_0_10px_#84cc16] animate-[flyAcross_31s_linear_infinite_8s]">
        🦇
      </div>

      {/* 6. Emergency Warning Siren Sweep at Top */}
      <div className="fixed -top-10 left-1/2 -translate-x-1/2 w-[650px] h-[240px] bg-gradient-to-b from-red-600/20 via-amber-500/10 to-transparent blur-3xl animate-[beaconPulse_6s_ease-in-out_infinite]" />

      {/* 7. VIVID ZOMBIE HORDE MARCHING ALONG THE BOTTOM HORIZON */}
      <div className="fixed bottom-0 left-0 right-0 h-24 overflow-hidden">
        {/* Zombie 1: Fast Glowing Mutant with Speech Bubble */}
        <div
          className="absolute bottom-1 flex flex-col items-center animate-[zombieWalkRight_24s_linear_infinite]"
          style={{ animationDelay: '0s' }}
        >
          <span className="px-1.5 py-0.5 rounded bg-lime-950/90 border border-lime-500/70 text-[9px] font-mono font-bold text-lime-300 shadow-[0_0_10px_#84cc16] mb-0.5 whitespace-nowrap">
            {zombieChants[0]}
          </span>
          <span className="text-2xl sm:text-3xl filter drop-shadow-[0_0_12px_#84cc16] animate-[zombieBob_0.7s_ease-in-out_infinite]">
            🧟‍♂️
          </span>
        </div>

        {/* Zombie 2: Biohazard Crawler */}
        <div
          className="absolute bottom-1 flex flex-col items-center animate-[zombieWalkRight_32s_linear_infinite]"
          style={{ animationDelay: '5s' }}
        >
          <span className="px-1.5 py-0.5 rounded bg-amber-950/90 border border-amber-500/70 text-[9px] font-mono font-bold text-amber-300 shadow-[0_0_10px_#f59e0b] mb-0.5 whitespace-nowrap">
            {zombieChants[1]}
          </span>
          <span className="text-2xl sm:text-3xl filter drop-shadow-[0_0_12px_#f59e0b] animate-[zombieBob_0.9s_ease-in-out_infinite]">
            🧟‍♀️
          </span>
        </div>

        {/* Zombie 3: Red-Eyed Alpha Ghoul */}
        <div
          className="absolute bottom-1 flex flex-col items-center animate-[zombieWalkRight_28s_linear_infinite]"
          style={{ animationDelay: '11s' }}
        >
          <span className="px-1.5 py-0.5 rounded bg-red-950/90 border border-red-500/70 text-[9px] font-mono font-bold text-red-300 shadow-[0_0_10px_#ef4444] mb-0.5 whitespace-nowrap">
            {zombieChants[2]}
          </span>
          <span className="text-2xl sm:text-3xl filter drop-shadow-[0_0_14px_#ef4444] animate-[zombieBob_0.6s_ease-in-out_infinite]">
            🧟
          </span>
        </div>

        {/* Zombie 4: Walking Left from Right Edge */}
        <div
          className="absolute bottom-1 flex flex-col items-center animate-[zombieWalkLeft_26s_linear_infinite]"
          style={{ animationDelay: '2s' }}
        >
          <span className="px-1.5 py-0.5 rounded bg-lime-950/90 border border-lime-500/70 text-[9px] font-mono font-bold text-lime-300 shadow-[0_0_10px_#84cc16] mb-0.5 whitespace-nowrap">
            {zombieChants[3]}
          </span>
          <span className="text-2xl sm:text-3xl filter drop-shadow-[0_0_12px_#84cc16] animate-[zombieBob_0.75s_ease-in-out_infinite]">
            🧟‍♂️
          </span>
        </div>

        {/* Zombie 5: Horde Follower */}
        <div
          className="absolute bottom-1 flex flex-col items-center animate-[zombieWalkLeft_35s_linear_infinite]"
          style={{ animationDelay: '14s' }}
        >
          <span className="text-xl sm:text-2xl filter drop-shadow-[0_0_10px_#f59e0b] animate-[zombieBob_0.8s_ease-in-out_infinite]">
            🧟‍♀️
          </span>
        </div>
      </div>

      {/* 8. Live Geiger Counter HUD Badge (Bottom Left) */}
      <div className="hidden sm:flex fixed bottom-3 left-3 items-center gap-2 px-2.5 py-1 rounded-xl bg-zinc-950/85 border border-lime-500/50 shadow-[0_0_15px_rgba(132,204,22,0.3)] backdrop-blur-md">
        <span className="text-sm animate-[spin_4s_linear_infinite]">☢️</span>
        <div className="font-mono leading-tight">
          <div className="text-[9px] text-lime-400 font-bold tracking-wider uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-ping" />
            <span>{t.geigerLabel || 'РАДИАЦИЯ • ЗОМБИ-РАДАР АКТИВЕН'}</span>
          </div>
          <div className="text-[10px] text-amber-400 font-extrabold">
            {radiationSv} Sv/h • BIOHAZARD LEVEL 5
          </div>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes zombieWalkRight {
          0% { transform: translateX(-120px); }
          100% { transform: translateX(calc(100vw + 120px)); }
        }
        @keyframes zombieWalkLeft {
          0% { transform: translateX(calc(100vw + 120px)) scaleX(-1); }
          100% { transform: translateX(-120px) scaleX(-1); }
        }
        @keyframes zombieBob {
          0%, 100% { transform: translateY(0px) rotate(-4deg); }
          50% { transform: translateY(-6px) rotate(5deg); }
        }
        @keyframes floatUp {
          0% { transform: translateY(20px) rotate(0deg) scale(0.8); opacity: 0; }
          20% { opacity: 0.75; }
          80% { opacity: 0.75; }
          100% { transform: translateY(-85vh) rotate(360deg) scale(1.15); opacity: 0; }
        }
        @keyframes flyAcross {
          0% { transform: translateX(-60px) translateY(0px) scale(0.9); }
          25% { transform: translateX(25vw) translateY(18px) scale(1.05); }
          50% { transform: translateX(50vw) translateY(-10px) scale(0.95); }
          75% { transform: translateX(75vw) translateY(14px) scale(1.05); }
          100% { transform: translateX(calc(100vw + 60px)) translateY(-5px) scale(0.9); }
        }
        @keyframes beaconPulse {
          0%, 100% { transform: translateX(-50%) rotate(-18deg); opacity: 0.25; }
          50% { transform: translateX(-50%) rotate(18deg); opacity: 0.65; }
        }
      `}</style>
    </div>
  );
}
