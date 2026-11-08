import React, { useEffect, useRef, useState } from 'react';
import { translations } from '../utils/translations';

export default function AtmosphereEffects({ enabled = true, lang = 'ru' }) {
  const canvasRef = useRef(null);
  const [radiationSv, setRadiationSv] = useState(4.85);
  const t = translations[lang] || translations.ru;

  // Live Geiger counter fluctuation
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      setRadiationSv((prev) => {
        const delta = (Math.random() - 0.48) * 0.42;
        return Number(Math.max(3.4, Math.min(9.95, prev + delta)).toFixed(2));
      });
    }, 1400);
    return () => clearInterval(interval);
  }, [enabled]);

  // 60FPS Procedural Apocalyptic Canvas Engine
  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    // 1. Ruined City Skyline Buildings (Generated on resize)
    let buildings = [];
    const generateSkyline = () => {
      buildings = [];
      let bx = 0;
      while (bx < W + 100) {
        const bw = 45 + Math.random() * 65;
        const bh = 45 + Math.random() * 95;
        const windows = [];
        const cols = Math.floor(bw / 14);
        const rows = Math.floor(bh / 18);
        for (let r = 1; r < rows; r++) {
          for (let c = 1; c < cols; c++) {
            if (Math.random() > 0.65) {
              windows.push({
                wx: bx + c * 13,
                wy: H - bh + r * 16,
                lit: Math.random() > 0.5,
                flickerSpeed: 0.02 + Math.random() * 0.06,
                phase: Math.random() * Math.PI * 2,
                color: Math.random() > 0.4 ? '#f59e0b' : '#84cc16'
              });
            }
          }
        }
        // Jagged ruined roof points
        const roofPoints = [];
        const steps = 4;
        for (let s = 0; s <= steps; s++) {
          roofPoints.push({
            rx: bx + (bw / steps) * s,
            ry: H - bh + (s === 0 || s === steps ? 0 : (Math.random() - 0.5) * 18)
          });
        }
        buildings.push({ x: bx, w: bw, h: bh, windows, roofPoints });
        bx += bw - 4;
      }
    };

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      generateSkyline();
    };
    generateSkyline();
    window.addEventListener('resize', resize);

    // 2. Skeletal Articulated Zombies with Inverse-Kinematics-like Joint Animation
    const zombieCount = Math.max(5, Math.min(9, Math.floor(W / 210)));
    const zombies = [];
    const palettes = [
      { glow: '#84cc16', skin: '#365314', bone: '#65a30d', eye: '#ef4444' }, // Toxic Lime Mutant
      { glow: '#f59e0b', skin: '#451a03', bone: '#d97706', eye: '#fef08a' }, // Amber Scorched Ghoul
      { glow: '#10b981', skin: '#064e3b', bone: '#10b981', eye: '#f87171' }, // Bio-Emerald Walker
      { glow: '#ef4444', skin: '#450a0a', bone: '#dc2626', eye: '#ffffff' }  // Crimson Alpha Stalker
    ];

    for (let i = 0; i < zombieCount; i++) {
      const dir = i % 2 === 0 ? 1 : -1;
      const scale = 0.72 + Math.random() * 0.42;
      const pal = palettes[i % palettes.length];
      zombies.push({
        x: Math.random() * W,
        dir,
        scale,
        speed: (0.42 + Math.random() * 0.48) * dir,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: 0.048 + Math.random() * 0.025,
        hunch: 0.28 + Math.random() * 0.22, // forward torso lean
        armReach: 0.3 + Math.random() * 0.4,
        variant: i % 3, // 0: walker, 1: runner/stalker, 2: heavy brute
        pal
      });
    }

    // 3. Articulated Flying Mutated Ravens / Bats (Bezier Wing Physics)
    const flyers = [];
    for (let i = 0; i < 5; i++) {
      const dir = i % 2 === 0 ? 1 : -1;
      flyers.push({
        x: Math.random() * W,
        y: 50 + Math.random() * (H * 0.35),
        baseY: 50 + Math.random() * (H * 0.35),
        vx: (1.2 + Math.random() * 1.1) * dir,
        wingPhase: Math.random() * Math.PI * 2,
        wingSpeed: 0.14 + Math.random() * 0.06,
        size: 14 + Math.random() * 10,
        glow: i % 2 === 0 ? '#ef4444' : '#84cc16'
      });
    }

    // 4. Radioactive Spores & Rising Fallout Ash
    const particles = [];
    for (let i = 0; i < 65; i++) {
      const cType = Math.random();
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 1 + Math.random() * 2.8,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -0.35 - Math.random() * 0.9,
        alpha: 0.25 + Math.random() * 0.6,
        pulse: Math.random() * Math.PI * 2,
        color: cType > 0.55 ? '#84cc16' : cType > 0.2 ? '#f59e0b' : '#ef4444'
      });
    }

    // 5. Slanted Acid Rain Streaks
    const rain = [];
    for (let i = 0; i < 38; i++) {
      rain.push({
        x: Math.random() * W,
        y: Math.random() * H,
        len: 14 + Math.random() * 22,
        vx: 1.1,
        vy: 6.5 + Math.random() * 4.5,
        alpha: 0.12 + Math.random() * 0.22
      });
    }

    // 6. Dynamic Lightning Bolt Generator
    let lightning = {
      alpha: 0,
      segments: [],
      color: '#84cc16',
      nextStrike: Date.now() + 3500
    };

    const triggerLightning = () => {
      const startX = W * (0.15 + Math.random() * 0.7);
      let currX = startX;
      let currY = 0;
      const segs = [];
      while (currY < H * 0.75) {
        const nextX = currX + (Math.random() - 0.5) * 85;
        const nextY = currY + 25 + Math.random() * 45;
        segs.push({ x1: currX, y1: currY, x2: nextX, y2: nextY });
        // Occasional branch
        if (Math.random() > 0.65) {
          segs.push({
            x1: currX,
            y1: currY,
            x2: currX + (Math.random() - 0.5) * 110,
            y2: currY + 40 + Math.random() * 50,
            branch: true
          });
        }
        currX = nextX;
        currY = nextY;
      }
      lightning.segments = segs;
      lightning.alpha = 0.85;
      lightning.color = Math.random() > 0.4 ? '#84cc16' : '#f59e0b';
      lightning.nextStrike = Date.now() + 5000 + Math.random() * 7000;
    };

    let tick = 0;

    // Helper: Draw a limb segment with joint thickness & glow
    const drawLimb = (x1, y1, x2, y2, width, strokeColor, glowColor) => {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.shadowBlur = 10;
      ctx.shadowColor = glowColor;
      ctx.stroke();
      ctx.restore();
    };

    // Helper: Draw a full articulated Zombie with walking kinematics
    const drawArticulatedZombie = (z) => {
      const tPhase = z.phase;
      const s = z.scale;
      const d = z.dir; // 1 = right, -1 = left
      const groundY = H - 6;

      // Vertical bobbing (2 steps per cycle)
      const bob = Math.abs(Math.sin(tPhase)) * 5 * s;

      // Hip position
      const hipX = z.x;
      const hipY = groundY - 38 * s + bob;

      // Spine / Shoulder position (leaning forward in direction of walk)
      const leanAngle = z.hunch + Math.sin(tPhase * 2) * 0.06;
      const torsoLen = (z.variant === 2 ? 32 : 28) * s;
      const shoulderX = hipX + Math.sin(leanAngle) * torsoLen * d;
      const shoulderY = hipY - Math.cos(leanAngle) * torsoLen;

      // Head position (nodding forward/back)
      const headNod = Math.sin(tPhase * 2 + 0.5) * 3 * s;
      const headX = shoulderX + (6 * s + headNod * 0.4) * d;
      const headY = shoulderY - 10 * s + Math.abs(headNod) * 0.3;

      // Leg kinematics (Left & Right)
      const drawZombieLeg = (phaseOffset, isBackLeg) => {
        const p = tPhase + phaseOffset;
        const thighAngle = Math.sin(p) * 0.55;
        // Knee bends backward relative to walk direction when lifting leg
        const kneeBend = Math.max(0, -Math.cos(p)) * 0.65 + 0.1;

        const thighLen = 20 * s;
        const shinLen = 20 * s;

        const kneeX = hipX + Math.sin(thighAngle) * thighLen * d;
        const kneeY = hipY + Math.cos(thighAngle) * thighLen;

        const totalShinAngle = thighAngle - kneeBend;
        const footX = kneeX + Math.sin(totalShinAngle) * shinLen * d;
        const footY = Math.min(groundY, kneeY + Math.cos(totalShinAngle) * shinLen);

        const col = isBackLeg ? '#18181b' : z.pal.skin;
        const outline = isBackLeg ? z.pal.bone : z.pal.glow;
        const w = (z.variant === 2 ? 6.5 : 4.8) * s;

        drawLimb(hipX, hipY, kneeX, kneeY, w, col, outline);
        drawLimb(kneeX, kneeY, footX, footY, w * 0.82, col, outline);
        // Foot
        drawLimb(footX, footY, footX + 6 * s * d, footY, w * 0.7, col, outline);
      };

      // Arm kinematics (Zombie outstretched reaching arms)
      const drawZombieArm = (phaseOffset, isBackArm) => {
        const p = tPhase + phaseOffset;
        // Outstretched forward (~60-85 deg) with eerie sway
        const upperAngle = 1.05 + Math.sin(p) * 0.25;
        const elbowAngle = upperAngle + 0.35 + Math.cos(p) * 0.2;

        const upperLen = 16 * s;
        const lowerLen = 15 * s;

        const elbowX = shoulderX + Math.sin(upperAngle) * upperLen * d;
        const elbowY = shoulderY + Math.cos(upperAngle) * upperLen * 0.35;

        const handX = elbowX + Math.sin(elbowAngle) * lowerLen * d;
        const handY = elbowY + Math.cos(elbowAngle) * lowerLen * 0.25;

        const col = isBackArm ? '#18181b' : z.pal.skin;
        const outline = isBackArm ? z.pal.bone : z.pal.glow;
        const w = (z.variant === 2 ? 5.2 : 3.8) * s;

        drawLimb(shoulderX, shoulderY + 3 * s, elbowX, elbowY, w, col, outline);
        drawLimb(elbowX, elbowY, handX, handY, w * 0.8, col, outline);

        // Claw fingers
        ctx.save();
        ctx.strokeStyle = outline;
        ctx.lineWidth = 1.4 * s;
        ctx.beginPath();
        ctx.moveTo(handX, handY);
        ctx.lineTo(handX + 4 * s * d, handY + 3 * s);
        ctx.moveTo(handX, handY);
        ctx.lineTo(handX + 5 * s * d, handY - 1 * s);
        ctx.stroke();
        ctx.restore();
      };

      // 1. Back Limbs
      drawZombieLeg(Math.PI, true);
      drawZombieArm(Math.PI, true);

      // 2. Torso & Ribcage
      const torsoWidth = (z.variant === 2 ? 11 : 7.5) * s;
      drawLimb(hipX, hipY, shoulderX, shoulderY, torsoWidth, z.pal.skin, z.pal.glow);

      // Glowing Radioactive Ribs on Torso
      ctx.save();
      ctx.strokeStyle = z.pal.glow;
      ctx.globalAlpha = 0.65;
      ctx.lineWidth = 1.4 * s;
      for (let r = 0.25; r <= 0.75; r += 0.25) {
        const rx = hipX + (shoulderX - hipX) * r;
        const ry = hipY + (shoulderY - hipY) * r;
        ctx.beginPath();
        ctx.moveTo(rx - 3 * s, ry);
        ctx.lineTo(rx + 4 * s * d, ry + 1.5 * s);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Head / Skull with Jaw & Glowing Eye
      ctx.save();
      ctx.beginPath();
      ctx.arc(headX, headY, (z.variant === 2 ? 8.5 : 7) * s, 0, Math.PI * 2);
      ctx.fillStyle = z.pal.skin;
      ctx.shadowBlur = 14;
      ctx.shadowColor = z.pal.glow;
      ctx.fill();
      ctx.lineWidth = 1.5 * s;
      ctx.strokeStyle = z.pal.glow;
      ctx.stroke();

      // Glowing Mutant Eye + Light Trail
      const eyeX = headX + 3.5 * s * d;
      const eyeY = headY - 1 * s;
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, 2 * s, 0, Math.PI * 2);
      ctx.fillStyle = z.pal.eye;
      ctx.shadowBlur = 12;
      ctx.shadowColor = z.pal.eye;
      ctx.fill();

      // Eye laser/glow trail
      ctx.beginPath();
      ctx.moveTo(eyeX, eyeY);
      ctx.lineTo(eyeX - 10 * s * d, eyeY - 2 * s);
      ctx.strokeStyle = z.pal.eye;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1.8 * s;
      ctx.stroke();
      ctx.restore();

      // 4. Front Limbs
      drawZombieLeg(0, false);
      drawZombieArm(0, false);
    };

    // Helper: Draw Articulated Winged Raven/Mutant Bat
    const drawWingedCreature = (f) => {
      const flap = Math.sin(f.wingPhase);
      const wingY = flap * f.size * 0.75;
      const wingMidY = Math.cos(f.wingPhase - 0.5) * f.size * 0.35;

      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.strokeStyle = '#18181b';
      ctx.fillStyle = '#09090b';
      ctx.lineWidth = 2.2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = f.glow;

      // Left & Right Articulated Wings
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-f.size * 0.5, wingMidY - 4, -f.size, wingY);
      ctx.quadraticCurveTo(-f.size * 0.4, wingMidY + 3, 0, 2);
      ctx.quadraticCurveTo(f.size * 0.4, wingMidY + 3, f.size, wingY);
      ctx.quadraticCurveTo(f.size * 0.5, wingMidY - 4, 0, 0);
      ctx.fill();
      ctx.strokeStyle = f.glow;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Glowing red eyes on creature
      ctx.beginPath();
      ctx.arc(f.vx > 0 ? 2 : -2, -1, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.restore();
    };

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, W, H);

      // A. Occasional Radioactive Lightning Storm
      if (Date.now() > lightning.nextStrike) {
        triggerLightning();
      }
      if (lightning.alpha > 0.01) {
        ctx.save();
        // Sky flash
        ctx.fillStyle = lightning.color;
        ctx.globalAlpha = lightning.alpha * 0.08;
        ctx.fillRect(0, 0, W, H);

        // Jagged bolt segments
        ctx.strokeStyle = lightning.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = lightning.color;
        lightning.segments.forEach((seg) => {
          ctx.beginPath();
          ctx.globalAlpha = seg.branch ? lightning.alpha * 0.45 : lightning.alpha * 0.85;
          ctx.lineWidth = seg.branch ? 1.2 : 2.5;
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
          ctx.stroke();
        });
        ctx.restore();
        lightning.alpha *= 0.88;
      }

      // B. Ruined Post-Apocalyptic Skyline at Bottom Horizon
      ctx.save();
      buildings.forEach((b) => {
        ctx.beginPath();
        ctx.moveTo(b.x, H);
        b.roofPoints.forEach((rp) => ctx.lineTo(rp.rx, rp.ry));
        ctx.lineTo(b.x + b.w, H);
        ctx.closePath();
        ctx.fillStyle = 'rgba(9, 9, 11, 0.72)';
        ctx.strokeStyle = 'rgba(132, 204, 22, 0.16)';
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();

        // Flickering survivors/fire windows inside ruins
        b.windows.forEach((w) => {
          const fl = Math.sin(tick * w.flickerSpeed + w.phase);
          if (fl > -0.2) {
            ctx.fillStyle = w.color;
            ctx.globalAlpha = 0.25 + (fl + 0.2) * 0.35;
            ctx.fillRect(w.wx, w.wy, 4, 6);
          }
        });
      });
      ctx.restore();

      // C. Acid Rain Streaks
      ctx.save();
      ctx.lineWidth = 1.15;
      rain.forEach((d) => {
        d.x += d.vx;
        d.y += d.vy;
        if (d.y > H) {
          d.y = -25;
          d.x = Math.random() * W;
        }
        if (d.x > W) d.x = 0;

        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.vx * 2.5, d.y + d.len);
        ctx.strokeStyle = `rgba(132, 204, 22, ${d.alpha})`;
        ctx.stroke();
      });
      ctx.restore();

      // D. Floating Radioactive Spores & Embers
      particles.forEach((p) => {
        p.x += p.vx + Math.sin(tick * 0.02 + p.pulse) * 0.25;
        p.y += p.vy;
        if (p.y < -10) {
          p.y = H + 10;
          p.x = Math.random() * W;
        }
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * (0.65 + Math.sin(tick * 0.05 + p.pulse) * 0.35);
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();
      });

      // E. Flying Winged Mutants in Sky
      flyers.forEach((f) => {
        f.x += f.vx;
        f.wingPhase += f.wingSpeed;
        f.y = f.baseY + Math.sin(f.wingPhase * 0.4) * 14;

        if (f.vx > 0 && f.x > W + 50) f.x = -50;
        if (f.vx < 0 && f.x < -50) f.x = W + 50;

        drawWingedCreature(f);
      });

      // F. Articulated Walking Zombie Horde along Bottom Ground
      zombies.forEach((z) => {
        z.x += z.speed;
        z.phase += z.phaseSpeed;

        if (z.dir > 0 && z.x > W + 80) z.x = -80;
        if (z.dir < 0 && z.x < -80) z.x = W + 80;

        drawArticulatedZombie(z);
      });

      // G. Toxic Ground Mist Gradient at very bottom
      const groundGrad = ctx.createLinearGradient(0, H - 55, 0, H);
      groundGrad.addColorStop(0, 'rgba(132, 204, 22, 0)');
      groundGrad.addColorStop(0.6, 'rgba(132, 204, 22, 0.08)');
      groundGrad.addColorStop(1, 'rgba(245, 158, 11, 0.18)');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, H - 55, W, 55);

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
    <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden select-none">
      {/* Fullscreen 60FPS Procedural Canvas Animation */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Live Rotating Radar & Geiger Counter HUD in Bottom-Left */}
      <div className="hidden sm:flex fixed bottom-3 left-3 items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-zinc-950/90 border border-lime-500/60 shadow-[0_0_25px_rgba(132,204,22,0.35)] backdrop-blur-md">
        {/* Mini Live Radar Sweep */}
        <div className="relative w-8 h-8 rounded-full bg-zinc-900 border border-lime-500/70 flex items-center justify-center overflow-hidden shrink-0">
          <div className="absolute inset-0 rounded-full border border-lime-500/20 scale-50" />
          <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(132,204,22,0.55)_90deg,transparent_95deg)] animate-[spin_2.4s_linear_infinite]" />
          {/* Radar Zombie Blips */}
          <span className="absolute top-1.5 right-2 w-1 h-1 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444] animate-ping" />
          <span className="absolute bottom-2 left-2 w-1 h-1 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b] animate-pulse" />
          <span className="w-1.5 h-1.5 rounded-full bg-lime-400 shadow-[0_0_6px_#84cc16]" />
        </div>

        <div className="font-mono leading-tight">
          <div className="text-[9px] text-lime-400 font-bold tracking-wider uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            <span>{t.geigerLabel || 'РАДИАЦИЯ • ЗОМБИ-РАДАР АКТИВЕН'}</span>
          </div>
          <div className="text-[11px] text-amber-400 font-extrabold flex items-center gap-2 mt-0.5">
            <span>☢️ {radiationSv} Sv/h</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-950/90 text-red-400 border border-red-700/60">
              BIOHAZARD
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
