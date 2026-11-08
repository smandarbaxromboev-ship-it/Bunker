import React, { useEffect, useRef, useState } from 'react';

export default function AtmosphereEffects({ enabled = true }) {
  const canvasRef = useRef(null);

  // Canvas floating radioactive embers & dust
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

    // Particle pool: radioactive sparks and toxic spore motes
    const count = 42;
    const items = [];
    for (let i = 0; i < count; i++) {
      items.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2.2 + 0.8,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 0.8 - 0.25, // float upwards
        alpha: Math.random() * 0.7 + 0.2,
        color: Math.random() > 0.4 ? 'rgba(245, 158, 11,' : 'rgba(132, 204, 22,' // amber or radioactive lime
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      items.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.y < 0) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${p.alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color === 'rgba(245, 158, 11,' ? '#f59e0b' : '#84cc16';
        ctx.fill();
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

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 1. Canvas Radioactive Spores / Embers */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-65" />

      {/* 2. Toxic Fog at the Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-36 sm:h-52 bg-gradient-to-t from-amber-950/25 via-emerald-950/15 to-transparent blur-2xl animate-pulse" />

      {/* 3. Occasional Radiation Lightning Flash in sky */}
      <div className="absolute inset-0 bg-emerald-500/5 mix-blend-screen opacity-0 animate-[radStorm_20s_ease-in-out_infinite]" />

      {/* 4. Flying Mutated Crows / Creatures across Sky */}
      <div className="absolute top-8 sm:top-14 left-0 w-8 h-4 opacity-30 animate-[flyAcross_25s_linear_infinite]">
        <svg viewBox="0 0 40 20" className="w-full h-full fill-current text-zinc-900 dark:text-zinc-600 animate-[wingFlap_0.6s_ease-in-out_infinite]">
          <path d="M0,10 Q10,0 20,10 Q30,0 40,10 Q30,6 20,14 Q10,6 0,10 Z" />
        </svg>
      </div>

      <div className="absolute top-16 sm:top-24 left-0 w-6 h-3 opacity-20 animate-[flyAcross_38s_linear_infinite_10s]">
        <svg viewBox="0 0 40 20" className="w-full h-full fill-current text-zinc-900 dark:text-zinc-600 animate-[wingFlap_0.5s_ease-in-out_infinite]">
          <path d="M0,10 Q10,0 20,10 Q30,0 40,10 Q30,6 20,14 Q10,6 0,10 Z" />
        </svg>
      </div>

      {/* 5. Emergency Warning Siren Beacon Sweep */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-amber-500/10 via-red-600/5 to-transparent blur-3xl opacity-40 animate-[beaconPulse_8s_ease-in-out_infinite]" />

      {/* 6. Wandering Zombie Horde Silhouettes along Bottom Horizon */}
      <div className="absolute -bottom-1 left-0 right-0 h-16 sm:h-20 overflow-hidden opacity-30">
        {/* Zombie 1 (Fast Stalker) */}
        <div 
          className="absolute bottom-0 w-10 h-16 bg-black rounded-t-full filter blur-[0.7px] animate-[walk_28s_linear_infinite]"
          style={{
            clipPath: 'polygon(30% 0%, 70% 0%, 85% 20%, 75% 45%, 90% 70%, 70% 100%, 30% 100%, 15% 70%, 25% 45%, 15% 20%)',
            animationDuration: '30s'
          }}
        >
          {/* Glowing Red Eyes */}
          <div className="absolute top-2 left-2.5 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444]" />
          <div className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444]" />
        </div>

        {/* Zombie 2 (Heavy Stumbling Mutant) */}
        <div 
          className="absolute bottom-0 w-14 h-16 bg-black rounded-t-full filter blur-[0.8px] animate-[walk_42s_linear_infinite]"
          style={{
            animationDelay: '12s',
            clipPath: 'polygon(40% 0%, 65% 0%, 85% 25%, 80% 50%, 95% 80%, 65% 100%, 35% 100%, 10% 75%, 20% 45%, 15% 25%)'
          }}
        >
          <div className="absolute top-3 left-3 w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_8px_#f59e0b]" />
          <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_8px_#f59e0b]" />
        </div>

        {/* Zombie 3 (Creeping Shadow Ghoul) */}
        <div 
          className="absolute bottom-0 w-9 h-13 bg-black rounded-t-full filter blur-[0.7px] animate-[walk_24s_linear_infinite]"
          style={{
            animationDelay: '6s',
            clipPath: 'polygon(35% 0%, 65% 0%, 80% 30%, 70% 60%, 85% 100%, 15% 100%, 30% 60%, 20% 30%)'
          }}
        >
          <div className="absolute top-1.5 left-2 w-1.5 h-1.5 bg-lime-400 rounded-full shadow-[0_0_8px_#84cc16]" />
        </div>

        {/* Zombie 4 (Crawling Mutant) */}
        <div 
          className="absolute bottom-0 w-12 h-10 bg-black filter blur-[0.8px] animate-[walk_36s_linear_infinite]"
          style={{
            animationDelay: '19s',
            clipPath: 'polygon(20% 40%, 50% 20%, 80% 40%, 100% 70%, 90% 100%, 10% 100%, 0% 70%)'
          }}
        >
          <div className="absolute top-2 left-4 w-1.5 h-1.5 bg-red-600 rounded-full shadow-[0_0_8px_#dc2626]" />
        </div>
      </div>

      {/* 7. Subtle CRT Terminal Scanline overlay */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.22)_50%)] bg-[length:100%_4px] opacity-15" 
      />

      {/* 8. Edge Biohazard Vignette */}
      <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.65)]" />

      {/* Keyframe styles */}
      <style>{`
        @keyframes walk {
          0% { transform: translateX(-80px) scale(0.9) skewX(-4deg); }
          50% { transform: translateX(50vw) scale(1) skewX(4deg); }
          100% { transform: translateX(calc(100vw + 80px)) scale(0.9) skewX(-4deg); }
        }
        @keyframes flyAcross {
          0% { transform: translateX(-50px) translateY(0); }
          50% { transform: translateX(50vw) translateY(15px); }
          100% { transform: translateX(calc(100vw + 50px)) translateY(-5px); }
        }
        @keyframes wingFlap {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.4); }
        }
        @keyframes radStorm {
          0%, 90%, 100% { opacity: 0; }
          92% { opacity: 0.25; }
          93% { opacity: 0.05; }
          95% { opacity: 0.35; }
          96% { opacity: 0; }
        }
        @keyframes beaconPulse {
          0%, 100% { transform: translateX(-50%) rotate(-15deg); opacity: 0.2; }
          50% { transform: translateX(-50%) rotate(15deg); opacity: 0.55; }
        }
      `}</style>
    </div>
  );
}
