import React, { memo, useMemo } from 'react';

const PARTICLE_COUNT = 40;
const COLORS = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#7C5CFC', '#96CEB4', '#4A6CF7', '#DDA0DD', '#9B59B6', '#F7DC6F'];

interface Particle {
  color: string;
  size: number;
  x: number;
  y: number;
  rotation: number;
  duration: number;
  delay: number;
}

function seededRandom(index: number): number {
  const x = Math.sin(index * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = seededRandom(i) * Math.PI * 2;
    const distance = 80 + seededRandom(i + 100) * 120;

    return {
      color: COLORS[i % COLORS.length],
      size: 8 + seededRandom(i + 200) * 10,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      rotation: seededRandom(i + 300) * 720 - 360,
      duration: 1.2 + seededRandom(i + 400) * 0.8,
      delay: seededRandom(i + 500) * 0.3
    };
  });
}

const PARTICLES = generateParticles();

const keyframesStyle = `
@keyframes confetti-burst {
  0% {
    transform: translate(0, 0) rotate(0deg) scale(1);
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  100% {
    transform: translate(var(--cx), var(--cy)) rotate(var(--cr)) scale(0);
    opacity: 0;
  }
}
`;

export const ConfettiExplosion = memo(() => {
  const particles = useMemo(
    () =>
      PARTICLES.map((p, i) => (
        <div
          key={i}
          style={
            {
              position: 'absolute',
              width: p.size,
              height: p.size * 0.6,
              backgroundColor: p.color,
              borderRadius: p.size > 6 ? 2 : 1,
              '--cx': `${p.x}px`,
              '--cy': `${p.y}px`,
              '--cr': `${p.rotation}deg`,
              animation: `confetti-burst ${p.duration}s ${p.delay}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
              opacity: 0
            } as React.CSSProperties
          }
        />
      )),
    []
  );

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <style>{keyframesStyle}</style>
      <div className="relative">{particles}</div>
    </div>
  );
});
