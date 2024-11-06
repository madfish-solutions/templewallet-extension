import React, { memo, useMemo } from 'react';

import { OrbitProps, PlanetAnimationParams, PlanetProps } from './types';

interface Props {
  planet: PlanetProps;
  animationParams: PlanetAnimationParams;
  orbitRadius: OrbitProps['radius'];
  direction: OrbitProps['direction'];
}

export const PlanetStick = memo<Props>(({ planet, animationParams, orbitRadius, direction }) => {
  const { id, startAlpha } = planet;

  const planetStickRotateAnimationName = useMemo(() => `planet-stick-rotate-${id}`, [id]);
  const planetRotateAnimationName = useMemo(() => `planet-rotate-${id}`, [id]);
  const animationsStylesheetText = useMemo(() => {
    const isClockwise = direction === 'clockwise';

    if (!animationParams.bounces) {
      const endAlpha = startAlpha + 2 * Math.PI * (isClockwise ? 1 : -1);

      return `@keyframes ${planetStickRotateAnimationName} {
  0% {
    transform: translate(-50%, -50%) rotate(${startAlpha}rad);
  }

  100% {
    transform: translate(-50%, -50%) rotate(${endAlpha}rad);
  }
}
      
@keyframes ${planetRotateAnimationName} {
  0% {
    transform: rotate(${-startAlpha}rad);
  }

  100% {
    transform: rotate(${-endAlpha}rad);
  }
}`;
    }

    const { beforeFirstBumpPercentage, beforeSecondBumpPercentage, leftEdgeAlpha, rightEdgeAlpha } = animationParams;
    const beforeFirstBumpAlpha = isClockwise ? rightEdgeAlpha : -Math.PI - leftEdgeAlpha;
    const beforeSecondBumpAlpha = isClockwise ? -Math.PI - leftEdgeAlpha : rightEdgeAlpha;

    return `@keyframes ${planetStickRotateAnimationName} {
  0% {
    transform: translate(-50%, -50%) rotate(${startAlpha}rad);
  }

  ${beforeFirstBumpPercentage}% {
    transform: translate(-50%, -50%) rotate(${beforeFirstBumpAlpha}rad);
  }

  ${beforeSecondBumpPercentage}% {
    transform: translate(-50%, -50%) rotate(${beforeSecondBumpAlpha}rad);
  }

  100% {
    transform: translate(-50%, -50%) rotate(${startAlpha}rad);
  }
}

@keyframes ${planetRotateAnimationName} {
  0% {
    transform: rotate(${-startAlpha}rad);
  }

  ${beforeFirstBumpPercentage}% {
    transform: rotate(${-beforeFirstBumpAlpha}rad);
  }

  ${beforeSecondBumpPercentage}% {
    transform: rotate(${-beforeSecondBumpAlpha}rad);
  }

  100% {
    transform: rotate(${-startAlpha}rad);
  }
}`;
  }, [animationParams, direction, planetRotateAnimationName, planetStickRotateAnimationName, startAlpha]);

  return (
    <>
      <style>{animationsStylesheetText}</style>
      <div
        className="absolute top-1/2 left-1/2 flex justify-end"
        style={{
          // transform: `translate(-50%, -50%) rotate(${startAlpha}rad)`,
          animation: `${planetStickRotateAnimationName} ${animationParams.duration}s linear infinite`,
          width: 2 * (orbitRadius + planet.radius),
          height: 2 * planet.radius
        }}
      >
        <div
          style={{
            // transform: `rotate(${-startAlpha}rad)`
            animation: `${planetRotateAnimationName} ${animationParams.duration}s linear infinite`
          }}
        >
          {planet.item}
        </div>
      </div>
    </>
  );
});
