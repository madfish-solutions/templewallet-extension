import React, { memo, useMemo, useRef } from 'react';

import { Planet } from './planet';
import { PlanetsAnimationProps, OrbitProps, PlanetAnimationParams } from './types';
import { calculateBottomGapAngle } from './utils';

interface Props extends PlanetsAnimationProps {
  orbit: OrbitProps;
}

const planetMayBounce = (separatorAlpha: number) => !Number.isNaN(separatorAlpha) && separatorAlpha < Math.PI / 2;

export const Orbit = memo<Props>(({ bottomGap, orbit }) => {
  const { planets, radius, direction, fullRotationPeriod } = orbit;
  const ref = useRef<HTMLDivElement>(null);

  const orderedPlanets = useMemo(() => planets.toSorted((a, b) => a.startAlpha - b.startAlpha), [planets]);

  const animationsParams = useMemo<PlanetAnimationParams[]>(() => {
    const bottomGapAngles = orderedPlanets.map(({ radius: planetRadius }) =>
      calculateBottomGapAngle(bottomGap, radius, planetRadius)
    );

    // This and the following calculations may be invalid if planets have significantly different radii.
    const leftBouncingPlanetIndex = bottomGapAngles.findIndex(planetMayBounce);
    const rightBouncingPlanetIndex = bottomGapAngles.findLastIndex(planetMayBounce);

    if (leftBouncingPlanetIndex === -1) {
      return planets.map(() => ({ bounces: false, duration: fullRotationPeriod }));
    }

    const leftSeparatorAlpha = bottomGapAngles[leftBouncingPlanetIndex];
    const rightSeparatorAlpha = bottomGapAngles[rightBouncingPlanetIndex];
    const { startAlpha: leftStartAlpha } = orderedPlanets[leftBouncingPlanetIndex];
    const { startAlpha: rightStartAlpha } = orderedPlanets[rightBouncingPlanetIndex];

    let travelBeforeFirstBumpAngle: number;
    let travelBetweenBumpsAngle: number;
    let travelToStartAngle: number;
    if (direction === 'clockwise') {
      travelBeforeFirstBumpAngle = rightSeparatorAlpha - rightStartAlpha;
      travelBetweenBumpsAngle = Math.PI + leftSeparatorAlpha + rightSeparatorAlpha - (rightStartAlpha - leftStartAlpha);
      travelToStartAngle = 1.5 * Math.PI - leftSeparatorAlpha + leftStartAlpha;
    } else {
      travelBeforeFirstBumpAngle = Math.PI + leftSeparatorAlpha + leftStartAlpha;
      travelBetweenBumpsAngle = Math.PI + leftSeparatorAlpha + rightSeparatorAlpha - (rightStartAlpha - leftStartAlpha);
      travelToStartAngle = rightSeparatorAlpha - rightStartAlpha;
    }

    const totalAnimationAngle = travelBeforeFirstBumpAngle + travelBetweenBumpsAngle + travelToStartAngle;
    const beforeFirstBumpPercentage = (travelBeforeFirstBumpAngle / totalAnimationAngle) * 100;
    const beforeSecondBumpPercentage =
      ((travelBeforeFirstBumpAngle + travelBetweenBumpsAngle) / totalAnimationAngle) * 100;
    const duration = (fullRotationPeriod * totalAnimationAngle) / (2 * Math.PI);

    return planets.map(({ startAlpha: planetStartAlpha }) => ({
      bounces: true,
      leftEdgeAlpha: leftSeparatorAlpha - planetStartAlpha + leftStartAlpha,
      rightEdgeAlpha: rightSeparatorAlpha + planetStartAlpha - rightStartAlpha,
      beforeFirstBumpPercentage,
      beforeSecondBumpPercentage,
      duration
    }));
  }, [bottomGap, direction, fullRotationPeriod, orderedPlanets, planets, radius]);

  return (
    <>
      <div
        ref={ref}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-secondary/15"
        style={{ width: radius * 2, height: radius * 2 }}
      >
        {planets.map((planet, index) => (
          <Planet
            key={planet.id}
            planet={planet}
            animationParams={animationsParams[index]}
            orbitRadius={radius}
            direction={direction}
          />
        ))}
      </div>
    </>
  );
});
