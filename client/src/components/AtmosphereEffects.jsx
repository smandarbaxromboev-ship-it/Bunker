import React, { useEffect, useRef, useState } from 'react';

export default function AtmosphereEffects({ enabled = true }) {
  const canvasRef = useRef(null);
  const [particles, setParticles] = useState([]);

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
    const count = 35;
    const items = [];
    for (let i = 0; i < count; i++) {
      items.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.8,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.7 - 0.2, // float upwards
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
        ctx.shadowBlur = 6;
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
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />

      {/* 2. Toxic Fog at the Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 sm:h-48 bg-gradient-to-t from-amber-950/20 via-emerald-950/10 to-transparent blur-2xl animate-pulse" />

      {/* 3. Wandering Zombie Silhouettes along Bottom Horizon */}
      <div className="absolute -bottom-1 left-0 right-0 h-16 sm:h-20 overflow-hidden opacity-25">
        {/* Zombie 1 */}
        <div 
          className="absolute bottom-0 w-10 h-16 bg-black rounded-t-full filter blur-[1px] animate-[walk_28s_linear_infinite]"
          style={{
            clipPath: 'polygon(30% 0%, 70% 0%, 85% 20%, 75% 45%, 90% 70%, 70% 100%, 30% 100%, 15% 70%, 25% 45%, 15% 20%)',
            animationDuration: '32s'
          }}
        >
          {/* Glowing Red Eyes */}
          <div className="absolute top-2 left-2.5 w-1 h-1 bg-red-500 rounded-full shadow-[0_0_6px_#ef4444]" />
          <div className="absolute top-2 right-2.5 w-1 h-1 bg-red-500 rounded-full shadow-[0_0_6px_#ef4444]" />
        </div>

        {/* Zombie 2 (Stumbling Mutant) */}
        <div 
          className="absolute bottom-0 w-12 h-14 bg-black rounded-t-full filter blur-[1px] animate-[walk_40s_linear_infinite]"
          style={{
            animationDelay: '12s',
            clipPath: 'polygon(40% 0%, 65% 0%, 85% 25%, 80% 50%, 95% 80%, 65% 100%, 35% 100%, 10% 75%, 20% 45%, 15% 25%)'
          }}
        >
          <div className="absolute top-3 left-3 w-1 h-1 bg-amber-400 rounded-full shadow-[0_0_6px_#f59e0b]" />
          <div className="absolute top-3 right-3 w-1 h-1 bg-amber-400 rounded-full shadow-[0_0_6px_#f59e0b]" />
        </div>

        {/* Zombie 3 (Creeping Shadow) */}
        <div 
          className="absolute bottom-0 w-8 h-12 bg-black rounded-t-full filter blur-[1px] animate-[walk_22s_linear_infinite]"
          style={{
            animationDelay: '6s',
            clipPath: 'polygon(35% 0%, 65% 0%, 80% 30%, 70% 60%, 85% 100%, 15% 100%, 30% 60%, 20% 30%)'
          }}
        >
          <div className="absolute top-1.5 left-2 w-1 h-1 bg-lime-400 rounded-full shadow-[0_0_6px_#84cc16]" />
        </div>
      </div>

      {/* 4. Subtle CRT Terminal Scanline overlay */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-15" 
      />

      {/* 5. Edge Biohazard Vignette */}
      <div className="absolute inset-0 shadow-[inset_0_0_90px_rgba(0,0,0,0.6)]" />

      {/* Custom keyframe styles for zombie walking */}
      <style>{`
        @keyframes walk {
          0% { transform: translateX(-60px) scale(0.9) skewX(-4deg); }
          50% { transform: translateX(50vw) scale(1) skewX(4deg); }
          100% { transform: translateX(calc(100vw + 60px)) scale(0.9) skewX(-4deg); }
        }
      `}</style>
    </div>
  );
}
