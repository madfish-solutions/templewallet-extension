import React, { memo, useMemo } from 'react';

import { OrbitProps, PlanetAnimationParams, PlanetProps } from './types';

interface Props {
  planet: PlanetProps;
  animationParams: PlanetAnimationParams;
  orbitRadius: OrbitProps['radius'];
  direction: OrbitProps['direction'];
}

const makePlanetAnimationKeyframe = (percentage: number, alpha: number, orbitRadius: number) => `${percentage}% {
    transform: translate(-50%, -50%) rotate(${alpha}rad) translateX(${orbitRadius}px) rotate(${-alpha}rad);
  }`;

export const Planet = memo<Props>(({ planet, animationParams, orbitRadius, direction }) => {
  const { id, startAlpha } = planet;

  const planetAnimationName = useMemo(() => `planet-motion-${id}`, [id]);
  const animationsStylesheetText = useMemo(() => {
    const isClockwise = direction === 'clockwise';

    if (!animationParams.bounces) {
      const endAlpha = startAlpha + 2 * Math.PI * (isClockwise ? 1 : -1);

      return `@keyframes ${planetAnimationName} {
  ${makePlanetAnimationKeyframe(0, startAlpha, orbitRadius)}

  ${makePlanetAnimationKeyframe(100, endAlpha, orbitRadius)}
}`;
    }

    const { beforeFirstBumpPercentage, beforeSecondBumpPercentage, leftEdgeAlpha, rightEdgeAlpha } = animationParams;
    const beforeFirstBumpAlpha = isClockwise ? rightEdgeAlpha : -Math.PI - leftEdgeAlpha;
    const beforeSecondBumpAlpha = isClockwise ? -Math.PI - leftEdgeAlpha : rightEdgeAlpha;

    return `@keyframes ${planetAnimationName} {
  ${makePlanetAnimationKeyframe(0, startAlpha, orbitRadius)}
  
  ${makePlanetAnimationKeyframe(beforeFirstBumpPercentage, beforeFirstBumpAlpha, orbitRadius)}

  ${makePlanetAnimationKeyframe(beforeSecondBumpPercentage, beforeSecondBumpAlpha, orbitRadius)}

  ${makePlanetAnimationKeyframe(100, startAlpha, orbitRadius)}
}`;
  }, [animationParams, direction, orbitRadius, planetAnimationName, startAlpha]);

  return (
    <>
      <style>{animationsStylesheetText}</style>
      <div
        className="absolute top-1/2 left-1/2"
        style={{
          animation: `${planetAnimationName} ${animationParams.duration}s linear infinite`
        }}
      >
        {planet.item}
      </div>
    </>
  );
});
