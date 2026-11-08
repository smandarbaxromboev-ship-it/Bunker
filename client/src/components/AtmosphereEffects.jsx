import React, { useEffect, useRef, useState } from 'react';
import { ShieldAlert, Radio, Activity } from 'lucide-react';
import { translations } from '../utils/translations';

export default function AtmosphereEffects({ enabled = true, lang = 'ru' }) {
  const canvasRef = useRef(null);
  const [radiationSv, setRadiationSv] = useState(5.42);
  const t = translations[lang] || translations.ru;

  // Fluctuating Geiger counter reading
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      setRadiationSv((prev) => {
        const delta = (Math.random() - 0.48) * 0.45;
        return Number(Math.max(3.6, Math.min(9.99, prev + delta)).toFixed(2));
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [enabled]);

  // 60FPS Procedural Apocalyptic Canvas Engine (NO EMOJIS / NO STICKERS)
  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    // 1. Ruined City Skyline & Nuclear Cooling Towers
    let buildings = [];
    let coolingTowers = [];

    const generateLandscape = () => {
      buildings = [];
      coolingTowers = [
        { x: W * 0.12, w: 72, h: 125 },
        { x: W * 0.82, w: 80, h: 135 }
      ];

      let bx = -20;
      while (bx < W + 100) {
        const bw = 48 + Math.random() * 68;
        const bh = 55 + Math.random() * 115;
        const windows = [];
        const cols = Math.floor(bw / 14);
        const rows = Math.floor(bh / 18);
        for (let r = 1; r < rows; r++) {
          for (let c = 1; c < cols; c++) {
            if (Math.random() > 0.62) {
              windows.push({
                wx: bx + c * 13,
                wy: H - bh + r * 16,
                flickerSpeed: 0.02 + Math.random() * 0.06,
                phase: Math.random() * Math.PI * 2,
                color: Math.random() > 0.35 ? '#f59e0b' : '#84cc16'
              });
            }
          }
        }
        const roofPoints = [];
        const steps = 5;
        for (let s = 0; s <= steps; s++) {
          roofPoints.push({
            rx: bx + (bw / steps) * s,
            ry: H - bh + (s === 0 || s === steps ? 0 : (Math.random() - 0.5) * 22)
          });
        }
        buildings.push({ x: bx, w: bw, h: bh, windows, roofPoints });
        bx += bw - 6;
      }
    };

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      generateLandscape();
    };
    generateLandscape();
    window.addEventListener('resize', resize);

    // 2. Skeletal Articulated Zombies with Full Inverse-Kinematics Joint Animation
    const zombieCount = Math.max(6, Math.min(11, Math.floor(W / 180)));
    const zombies = [];
    const palettes = [
      { glow: '#84cc16', fill: '#1a2e05', rim: '#a3e635', eye: '#ef4444' }, // Toxic Radioactive Mutant
      { glow: '#f59e0b', fill: '#271202', rim: '#fbbf24', eye: '#fef08a' }, // Scorched Wasteland Ghoul
      { glow: '#10b981', fill: '#022c22', rim: '#34d399', eye: '#f87171' }, // Bio-Virology Walker
      { glow: '#ef4444', fill: '#2a0404', rim: '#f87171', eye: '#ffffff' }  // Red Alpha Stalker
    ];

    for (let i = 0; i < zombieCount; i++) {
      const dir = i % 2 === 0 ? 1 : -1;
      const scale = 0.85 + Math.random() * 0.45;
      const pal = palettes[i % palettes.length];
      zombies.push({
        x: (W / zombieCount) * i + Math.random() * 80,
        dir,
        scale,
        speed: (0.48 + Math.random() * 0.52) * dir,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: 0.052 + Math.random() * 0.028,
        hunch: 0.3 + Math.random() * 0.24,
        variant: i % 3, // 0: walker, 1: hunched stalker, 2: armored brute
        pal
      });
    }

    // 3. Articulated Winged Ravens / Mutated Creatures (Bezier Wing Physics)
    const flyers = [];
    for (let i = 0; i < 6; i++) {
      const dir = i % 2 === 0 ? 1 : -1;
      flyers.push({
        x: Math.random() * W,
        y: 45 + Math.random() * (H * 0.38),
        baseY: 45 + Math.random() * (H * 0.38),
        vx: (1.35 + Math.random() * 1.2) * dir,
        wingPhase: Math.random() * Math.PI * 2,
        wingSpeed: 0.15 + Math.random() * 0.06,
        size: 16 + Math.random() * 11,
        glow: i % 2 === 0 ? '#ef4444' : '#84cc16'
      });
    }

    // 4. Floating Vector Trefoil Radiation & Biohazard Crests (Canvas Drawn, NOT Emojis)
    const vectorSymbols = [];
    for (let i = 0; i < 7; i++) {
      vectorSymbols.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 16 + Math.random() * 14,
        vy: -0.35 - Math.random() * 0.45,
        vx: (Math.random() - 0.5) * 0.3,
        angle: Math.random() * Math.PI * 2,
        vAngle: (Math.random() - 0.5) * 0.02,
        color: i % 2 === 0 ? '#84cc16' : '#f59e0b',
        alpha: 0.18 + Math.random() * 0.22
      });
    }

    // 5. Radioactive Spores & Rising Fallout Ash
    const particles = [];
    for (let i = 0; i < 70; i++) {
      const cType = Math.random();
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 1.1 + Math.random() * 2.6,
        vx: (Math.random() - 0.5) * 0.65,
        vy: -0.4 - Math.random() * 0.95,
        alpha: 0.3 + Math.random() * 0.6,
        pulse: Math.random() * Math.PI * 2,
        color: cType > 0.55 ? '#84cc16' : cType > 0.2 ? '#f59e0b' : '#ef4444'
      });
    }

    // 6. Slanted Acid Rain Streaks
    const rain = [];
    for (let i = 0; i < 45; i++) {
      rain.push({
        x: Math.random() * W,
        y: Math.random() * H,
        len: 16 + Math.random() * 24,
        vx: 1.25,
        vy: 7 + Math.random() * 5,
        alpha: 0.14 + Math.random() * 0.22
      });
    }

    // 7. Dynamic Lightning Bolt Generator
    let lightning = {
      alpha: 0,
      segments: [],
      color: '#84cc16',
      nextStrike: Date.now() + 2200
    };

    const triggerLightning = () => {
      const startX = W * (0.15 + Math.random() * 0.7);
      let currX = startX;
      let currY = 0;
      const segs = [];
      while (currY < H * 0.78) {
        const nextX = currX + (Math.random() - 0.5) * 90;
        const nextY = currY + 24 + Math.random() * 44;
        segs.push({ x1: currX, y1: currY, x2: nextX, y2: nextY });
        if (Math.random() > 0.6) {
          segs.push({
            x1: currX,
            y1: currY,
            x2: currX + (Math.random() - 0.5) * 120,
            y2: currY + 35 + Math.random() * 55,
            branch: true
          });
        }
        currX = nextX;
        currY = nextY;
      }
      lightning.segments = segs;
      lightning.alpha = 0.9;
      lightning.color = Math.random() > 0.4 ? '#84cc16' : '#f59e0b';
      lightning.nextStrike = Date.now() + 4500 + Math.random() * 6000;
    };

    let tick = 0;

    // Helper: Draw a vector Radiation Trefoil Symbol on Canvas
    const drawRadiationSymbol = (x, y, radius, rotation, color, alpha) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = color;

      // Outer dashed ring
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3 Radiation Blades
      for (let i = 0; i < 3; i++) {
        const startAngle = (i * 2 * Math.PI) / 3 - Math.PI / 6;
        const endAngle = startAngle + Math.PI / 3;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.78, startAngle, endAngle, false);
        ctx.arc(0, 0, radius * 0.28, endAngle, startAngle, true);
        ctx.closePath();
        ctx.fill();
      }

      // Center core
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    // Helper: Draw tapered anatomical limb segment
    const drawAnatomicalLimb = (x1, y1, x2, y2, w1, w2, fillCol, rimCol, glowCol) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const angle = Math.atan2(dy, dx);
      const nx = -Math.sin(angle);
      const ny = Math.cos(angle);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x1 + nx * (w1 * 0.5), y1 + ny * (w1 * 0.5));
      ctx.lineTo(x2 + nx * (w2 * 0.5), y2 + ny * (w2 * 0.5));
      ctx.lineTo(x2 - nx * (w2 * 0.5), y2 - ny * (w2 * 0.5));
      ctx.lineTo(x1 - nx * (w1 * 0.5), y1 - ny * (w1 * 0.5));
      ctx.closePath();

      ctx.fillStyle = fillCol;
      ctx.shadowBlur = 12;
      ctx.shadowColor = glowCol;
      ctx.fill();

      ctx.lineWidth = 1.35;
      ctx.strokeStyle = rimCol;
      ctx.stroke();
      ctx.restore();
    };

    // Helper: Draw a full articulated Zombie with walking kinematics & anatomy
    const drawArticulatedZombie = (z) => {
      const tPhase = z.phase;
      const s = z.scale;
      const d = z.dir; // 1 = right, -1 = left
      const groundY = H - 4;

      const bob = Math.abs(Math.sin(tPhase)) * 5.5 * s;
      const hipX = z.x;
      const hipY = groundY - 40 * s + bob;

      const leanAngle = z.hunch + Math.sin(tPhase * 2) * 0.07;
      const torsoLen = (z.variant === 2 ? 34 : 29) * s;
      const shoulderX = hipX + Math.sin(leanAngle) * torsoLen * d;
      const shoulderY = hipY - Math.cos(leanAngle) * torsoLen;

      const headNod = Math.sin(tPhase * 2 + 0.5) * 3.5 * s;
      const headX = shoulderX + (6.5 * s + headNod * 0.4) * d;
      const headY = shoulderY - 11 * s + Math.abs(headNod) * 0.3;

      const drawZombieLeg = (phaseOffset, isBackLeg) => {
        const p = tPhase + phaseOffset;
        const thighAngle = Math.sin(p) * 0.56;
        const kneeBend = Math.max(0, -Math.cos(p)) * 0.68 + 0.12;

        const thighLen = 21 * s;
        const shinLen = 21 * s;

        const kneeX = hipX + Math.sin(thighAngle) * thighLen * d;
        const kneeY = hipY + Math.cos(thighAngle) * thighLen;

        const totalShinAngle = thighAngle - kneeBend;
        const footX = kneeX + Math.sin(totalShinAngle) * shinLen * d;
        const footY = Math.min(groundY, kneeY + Math.cos(totalShinAngle) * shinLen);

        const fill = isBackLeg ? '#09090b' : z.pal.fill;
        const rim = isBackLeg ? z.pal.glow : z.pal.rim;
        const w = (z.variant === 2 ? 8 : 6) * s;

        drawAnatomicalLimb(hipX, hipY, kneeX, kneeY, w, w * 0.78, fill, rim, z.pal.glow);
        drawAnatomicalLimb(kneeX, kneeY, footX, footY, w * 0.75, w * 0.55, fill, rim, z.pal.glow);
        drawAnatomicalLimb(footX, footY, footX + 7 * s * d, footY, w * 0.55, w * 0.4, fill, rim, z.pal.glow);
      };

      const drawZombieArm = (phaseOffset, isBackArm) => {
        const p = tPhase + phaseOffset;
        const upperAngle = 1.08 + Math.sin(p) * 0.26;
        const elbowAngle = upperAngle + 0.36 + Math.cos(p) * 0.22;

        const upperLen = 17 * s;
        const lowerLen = 16 * s;

        const elbowX = shoulderX + Math.sin(upperAngle) * upperLen * d;
        const elbowY = shoulderY + Math.cos(upperAngle) * upperLen * 0.35;

        const handX = elbowX + Math.sin(elbowAngle) * lowerLen * d;
        const handY = elbowY + Math.cos(elbowAngle) * lowerLen * 0.25;

        const fill = isBackArm ? '#09090b' : z.pal.fill;
        const rim = isBackArm ? z.pal.glow : z.pal.rim;
        const w = (z.variant === 2 ? 6.5 : 4.8) * s;

        drawAnatomicalLimb(shoulderX, shoulderY + 3 * s, elbowX, elbowY, w, w * 0.75, fill, rim, z.pal.glow);
        drawAnatomicalLimb(elbowX, elbowY, handX, handY, w * 0.72, w * 0.5, fill, rim, z.pal.glow);

        // Articulated claws
        ctx.save();
        ctx.strokeStyle = rim;
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        ctx.moveTo(handX, handY);
        ctx.lineTo(handX + 5 * s * d, handY + 3.5 * s);
        ctx.moveTo(handX, handY);
        ctx.lineTo(handX + 6 * s * d, handY - 1 * s);
        ctx.moveTo(handX, handY);
        ctx.lineTo(handX + 4 * s * d, handY + 1.5 * s);
        ctx.stroke();
        ctx.restore();
      };

      // 1. Back Limbs
      drawZombieLeg(Math.PI, true);
      drawZombieArm(Math.PI, true);

      // 2. Torso & Glowing Ribcage
      const torsoW = (z.variant === 2 ? 13 : 9.5) * s;
      drawAnatomicalLimb(hipX, hipY, shoulderX, shoulderY, torsoW * 0.75, torsoW, z.pal.fill, z.pal.rim, z.pal.glow);

      // Glowing Radioactive Ribs & Spine Core
      ctx.save();
      ctx.strokeStyle = z.pal.glow;
      ctx.shadowBlur = 8;
      ctx.shadowColor = z.pal.glow;
      ctx.lineWidth = 1.6 * s;
      for (let r = 0.22; r <= 0.78; r += 0.18) {
        const rx = hipX + (shoulderX - hipX) * r;
        const ry = hipY + (shoulderY - hipY) * r;
        ctx.beginPath();
        ctx.moveTo(rx - 3.5 * s, ry);
        ctx.lineTo(rx + 4.5 * s * d, ry + 1.5 * s);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Head / Skull with Jaw & Glowing Laser Eye
      ctx.save();
      ctx.beginPath();
      const headR = (z.variant === 2 ? 9 : 7.5) * s;
      ctx.arc(headX, headY, headR, 0, Math.PI * 2);
      ctx.fillStyle = z.pal.fill;
      ctx.shadowBlur = 15;
      ctx.shadowColor = z.pal.glow;
      ctx.fill();
      ctx.lineWidth = 1.6 * s;
      ctx.strokeStyle = z.pal.rim;
      ctx.stroke();

      // Open Zombie Jaw
      const jawOpen = (Math.sin(tPhase * 1.5) + 1) * 1.8 * s;
      ctx.beginPath();
      ctx.moveTo(headX + 2 * s * d, headY + 3 * s);
      ctx.lineTo(headX + 6.5 * s * d, headY + (5 * s + jawOpen));
      ctx.lineTo(headX, headY + 6 * s);
      ctx.strokeStyle = z.pal.rim;
      ctx.lineWidth = 1.4 * s;
      ctx.stroke();

      // Glowing Mutant Eye + Light Trail
      const eyeX = headX + 3.8 * s * d;
      const eyeY = headY - 1.2 * s;
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, 2.2 * s, 0, Math.PI * 2);
      ctx.fillStyle = z.pal.eye;
      ctx.shadowBlur = 14;
      ctx.shadowColor = z.pal.eye;
      ctx.fill();

      // Eye glow trail
      ctx.beginPath();
      ctx.moveTo(eyeX, eyeY);
      ctx.lineTo(eyeX - 13 * s * d, eyeY - 2 * s);
      ctx.strokeStyle = z.pal.eye;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 2 * s;
      ctx.stroke();
      ctx.restore();

      // 4. Front Limbs
      drawZombieLeg(0, false);
      drawZombieArm(0, false);
    };

    // Helper: Draw Articulated Winged Raven/Mutant Creature
    const drawWingedCreature = (f) => {
      const flap = Math.sin(f.wingPhase);
      const wingY = flap * f.size * 0.8;
      const wingMidY = Math.cos(f.wingPhase - 0.5) * f.size * 0.38;

      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.fillStyle = '#09090b';
      ctx.shadowBlur = 12;
      ctx.shadowColor = f.glow;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-f.size * 0.5, wingMidY - 5, -f.size, wingY);
      ctx.quadraticCurveTo(-f.size * 0.4, wingMidY + 3, 0, 2.5);
      ctx.quadraticCurveTo(f.size * 0.4, wingMidY + 3, f.size, wingY);
      ctx.quadraticCurveTo(f.size * 0.5, wingMidY - 5, 0, 0);
      ctx.fill();
      ctx.strokeStyle = f.glow;
      ctx.lineWidth = 1.35;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(f.vx > 0 ? 2.5 : -2.5, -1, 1.6, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.restore();
    };

    // Helper: Draw Nuclear Cooling Tower with Toxic Plume
    const drawCoolingTower = (t, tickVal) => {
      const topW = t.w * 0.58;
      const botW = t.w;
      const topY = H - t.h;

      ctx.save();
      // Rising green toxic steam plume from tower mouth
      for (let p = 0; p < 3; p++) {
        const py = topY - 12 - ((tickVal * 0.4 + p * 22) % 60);
        const px = t.x + Math.sin(tickVal * 0.03 + p) * 14;
        const pr = 14 + ((topY - py) * 0.45);
        const pAlpha = Math.max(0, 0.22 - (topY - py) / 280);
        const grad = ctx.createRadialGradient(px, py, 2, px, py, pr);
        grad.addColorStop(0, `rgba(132, 204, 22, ${pAlpha})`);
        grad.addColorStop(1, 'rgba(132, 204, 22, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
      }

      // Hyperboloid Cooling Tower silhouette
      ctx.beginPath();
      ctx.moveTo(t.x - botW / 2, H);
      ctx.quadraticCurveTo(t.x - topW * 0.42, H - t.h * 0.55, t.x - topW / 2, topY);
      ctx.lineTo(t.x + topW / 2, topY);
      ctx.quadraticCurveTo(t.x + topW * 0.42, H - t.h * 0.55, t.x + botW / 2, H);
      ctx.closePath();
      ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.28)';
      ctx.lineWidth = 1.2;
      ctx.fill();
      ctx.stroke();

      // Glowing hazard rim at top of tower
      ctx.beginPath();
      ctx.moveTo(t.x - topW / 2, topY);
      ctx.lineTo(t.x + topW / 2, topY);
      ctx.strokeStyle = '#84cc16';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#84cc16';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    };

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, W, H);

      // A. Occasional Rotating Searchlight Beams from Bunker Roof
      ctx.save();
      const beamAngle1 = Math.sin(tick * 0.008) * 0.55 - 0.2;
      ctx.translate(W * 0.2, H);
      ctx.rotate(beamAngle1);
      const beamGrad = ctx.createLinearGradient(0, 0, 0, -H * 0.85);
      beamGrad.addColorStop(0, 'rgba(245, 158, 11, 0.14)');
      beamGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(-140, -H * 0.85);
      ctx.lineTo(140, -H * 0.85);
      ctx.lineTo(12, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // B. Radioactive Lightning Storm
      if (Date.now() > lightning.nextStrike) {
        triggerLightning();
      }
      if (lightning.alpha > 0.01) {
        ctx.save();
        ctx.fillStyle = lightning.color;
        ctx.globalAlpha = lightning.alpha * 0.09;
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = lightning.color;
        ctx.shadowBlur = 22;
        ctx.shadowColor = lightning.color;
        lightning.segments.forEach((seg) => {
          ctx.beginPath();
          ctx.globalAlpha = seg.branch ? lightning.alpha * 0.5 : lightning.alpha * 0.9;
          ctx.lineWidth = seg.branch ? 1.3 : 2.8;
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
          ctx.stroke();
        });
        ctx.restore();
        lightning.alpha *= 0.88;
      }

      // C. Floating Vector Radiation Trefoil Symbols
      vectorSymbols.forEach((vs) => {
        vs.y += vs.vy;
        vs.x += vs.vx;
        vs.angle += vs.vAngle;
        if (vs.y < -40) {
          vs.y = H + 40;
          vs.x = Math.random() * W;
        }
        drawRadiationSymbol(vs.x, vs.y, vs.r, vs.angle, vs.color, vs.alpha);
      });

      // D. Nuclear Cooling Towers & Ruined Skyline
      coolingTowers.forEach((ct) => drawCoolingTower(ct, tick));

      ctx.save();
      buildings.forEach((b) => {
        ctx.beginPath();
        ctx.moveTo(b.x, H);
        b.roofPoints.forEach((rp) => ctx.lineTo(rp.rx, rp.ry));
        ctx.lineTo(b.x + b.w, H);
        ctx.closePath();
        ctx.fillStyle = 'rgba(9, 9, 11, 0.78)';
        ctx.strokeStyle = 'rgba(132, 204, 22, 0.2)';
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();

        b.windows.forEach((w) => {
          const fl = Math.sin(tick * w.flickerSpeed + w.phase);
          if (fl > -0.15) {
            ctx.fillStyle = w.color;
            ctx.globalAlpha = 0.22 + (fl + 0.15) * 0.35;
            ctx.fillRect(w.wx, w.wy, 4, 6);
          }
        });
      });
      ctx.restore();

      // E. Slanted Acid Rain
      ctx.save();
      ctx.lineWidth = 1.2;
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

      // F. Radioactive Spores
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

      // G. Flying Winged Mutants
      flyers.forEach((f) => {
        f.x += f.vx;
        f.wingPhase += f.wingSpeed;
        f.y = f.baseY + Math.sin(f.wingPhase * 0.4) * 14;

        if (f.vx > 0 && f.x > W + 50) f.x = -50;
        if (f.vx < 0 && f.x < -50) f.x = W + 50;

        drawWingedCreature(f);
      });

      // H. Articulated Walking Zombie Horde along Bottom Horizon
      zombies.forEach((z) => {
        z.x += z.speed;
        z.phase += z.phaseSpeed;

        if (z.dir > 0 && z.x > W + 80) z.x = -80;
        if (z.dir < 0 && z.x < -80) z.x = W + 80;

        drawArticulatedZombie(z);
      });

      // I. Toxic Ground Mist at Bottom
      const groundGrad = ctx.createLinearGradient(0, H - 60, 0, H);
      groundGrad.addColorStop(0, 'rgba(132, 204, 22, 0)');
      groundGrad.addColorStop(0.65, 'rgba(132, 204, 22, 0.1)');
      groundGrad.addColorStop(1, 'rgba(245, 158, 11, 0.22)');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, H - 60, W, 60);

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

      {/* Live Rotating Radar & Geiger Counter HUD in Bottom-Left (Pure SVG & CSS, Zero Emojis) */}
      <div className="hidden sm:flex fixed bottom-3 left-3 items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-zinc-950/90 border border-lime-500/60 shadow-[0_0_25px_rgba(132,204,22,0.35)] backdrop-blur-md">
        <div className="relative w-8 h-8 rounded-full bg-zinc-900 border border-lime-500/70 flex items-center justify-center overflow-hidden shrink-0">
          <div className="absolute inset-0 rounded-full border border-lime-500/20 scale-50" />
          <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(132,204,22,0.6)_90deg,transparent_95deg)] animate-[spin_2.2s_linear_infinite]" />
          <span className="absolute top-1.5 right-2 w-1 h-1 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444] animate-ping" />
          <span className="absolute bottom-2 left-2 w-1 h-1 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b] animate-pulse" />
          <span className="w-1.5 h-1.5 rounded-full bg-lime-400 shadow-[0_0_6px_#84cc16]" />
        </div>

        <div className="font-mono leading-tight">
          <div className="text-[9px] text-lime-400 font-bold tracking-wider uppercase flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-lime-400 animate-pulse" />
            <span>{t.geigerLabel || 'РАДИАЦИЯ • ЗОМБИ-РАДАР АКТИВЕН'}</span>
          </div>
          <div className="text-[11px] text-amber-400 font-extrabold flex items-center gap-2 mt-0.5">
            <ShieldAlert className="w-3.5 h-3.5 text-red-500 animate-bounce" />
            <span>{radiationSv} Sv/h</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-950/90 text-red-400 border border-red-700/60">
              BIOHAZARD
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
