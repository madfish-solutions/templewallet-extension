import React, { memo, useMemo } from 'react';

import clsx from 'clsx';

import { Logo } from 'app/atoms/Logo';
import { TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { ETHEREUM_MAINNET_CHAIN_ID, OTHER_COMMON_MAINNET_CHAIN_IDS, TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';

import { SUN_RADIUS } from './constants';
import { EvmPlanetItem } from './evm-planet-item';
import { Orbit } from './orbit';
import styles from './PlanetsAnimation.module.css';
import { ReactComponent as SunGlow } from './sun-glow.svg';
import { PlanetsAnimationProps, OrbitProps } from './types';
import { calculateBottomGapAngle } from './utils';

const orbitsBase = [
  {
    fullRotationPeriod: 150,
    radius: 86,
    direction: 'clockwise' as const,
    planets: [
      {
        id: 'tezos',
        radius: 19,
        item: <TezosNetworkLogo size={38} chainId={TEZOS_MAINNET_CHAIN_ID} className="p-[3px]" />
      },
      {
        id: 'avalanche',
        radius: 19,
        item: <EvmPlanetItem chainId={OTHER_COMMON_MAINNET_CHAIN_IDS.avalanche} padding="large" />
      }
    ]
  },
  {
    fullRotationPeriod: 142,
    radius: 136,
    direction: 'counter-clockwise' as const,
    planets: [
      {
        id: 'bsc',
        radius: 19,
        item: <EvmPlanetItem chainId={OTHER_COMMON_MAINNET_CHAIN_IDS.bsc} />
      },
      {
        id: 'polygon',
        radius: 19,
        item: <EvmPlanetItem chainId={OTHER_COMMON_MAINNET_CHAIN_IDS.polygon} />
      }
    ]
  },
  {
    fullRotationPeriod: 136,
    radius: 186,
    direction: 'clockwise' as const,
    planets: [
      {
        id: 'eth',
        radius: 19,
        item: <EvmPlanetItem chainId={ETHEREUM_MAINNET_CHAIN_ID} />
      },
      {
        id: 'optimism',
        radius: 19,
        item: <EvmPlanetItem chainId={OTHER_COMMON_MAINNET_CHAIN_IDS.optimism} padding="medium" />
      },
      {
        id: 'arbitrum',
        radius: 19,
        item: <EvmPlanetItem chainId={OTHER_COMMON_MAINNET_CHAIN_IDS.arbitrum} />
      },
      {
        id: 'base',
        radius: 19,
        item: <EvmPlanetItem chainId={OTHER_COMMON_MAINNET_CHAIN_IDS.base} />
      }
    ]
  },
  {
    fullRotationPeriod: 130,
    radius: 236,
    direction: 'counter-clockwise' as const,
    planets: []
  }
];

export const PlanetsAnimation = memo<PlanetsAnimationProps>(({ bottomGap }) => {
  const orbits = useMemo<OrbitProps[]>(() => {
    const { planets: thirdOrbitPlanets, radius: thirdOrbitRadius } = orbitsBase[2];
    // This and the following calculations may be invalid if planets have significantly different radii.
    const [thirdOrbitFirstPlanetBottomGapAngle, thirdOrbitLastPlanetBottomGapAngle] = [
      thirdOrbitPlanets[0],
      thirdOrbitPlanets.at(-1)!
    ].map(({ radius: planetRadius }) => calculateBottomGapAngle(bottomGap, thirdOrbitRadius, planetRadius));
    let orbitsStartAlphas: number[][];

    if (Number.isNaN(thirdOrbitFirstPlanetBottomGapAngle)) {
      orbitsStartAlphas = [
        [-Math.PI / 2, Math.PI / 2],
        [-Math.PI, 0],
        [(-5 * Math.PI) / 4, (-3 * Math.PI) / 4, -Math.PI / 4, Math.PI / 4]
      ];
    } else {
      const thirdOrbitMinPlanetBottomGapAngle = Math.min(
        thirdOrbitFirstPlanetBottomGapAngle,
        thirdOrbitLastPlanetBottomGapAngle
      );
      const thirdOrbitTravelBeforeFirstBumpAngle = Math.PI / 12;
      const thirdOrbitFirstPlanetStartAlpha =
        -Math.PI - thirdOrbitMinPlanetBottomGapAngle + thirdOrbitTravelBeforeFirstBumpAngle;
      const thirdOrbitLastPlanetStartAlpha = thirdOrbitMinPlanetBottomGapAngle - thirdOrbitTravelBeforeFirstBumpAngle;
      const thirdOrbitPlanetsStartAlphas = thirdOrbitPlanets.map(
        (_, index) =>
          thirdOrbitFirstPlanetStartAlpha * (1 - index / (thirdOrbitPlanets.length - 1)) +
          thirdOrbitLastPlanetStartAlpha * (index / (thirdOrbitPlanets.length - 1))
      );
      const secondOrbitStartAlphas = [
        (thirdOrbitPlanetsStartAlphas[0] + thirdOrbitPlanetsStartAlphas[1]) / 2,
        (thirdOrbitPlanetsStartAlphas.at(-2)! + thirdOrbitPlanetsStartAlphas.at(-1)!) / 2
      ];
      orbitsStartAlphas = [[-Math.PI / 2, Math.PI / 2], secondOrbitStartAlphas, thirdOrbitPlanetsStartAlphas];
    }

    return orbitsBase.map(({ planets, ...restOrbitProps }, index) => ({
      ...restOrbitProps,
      planets: planets.map((planet, planetIndex) => ({
        ...planet,
        startAlpha: orbitsStartAlphas[index][planetIndex]
      }))
    }));
  }, [bottomGap]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="w-full aspect-square overflow-y-visible relative">
        {orbits.map((orbit, index) => (
          <Orbit key={index} orbit={orbit} bottomGap={bottomGap} />
        ))}

        <SunGlow
          style={{ width: 136 }}
          className="h-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        />
      </div>

      <div className={clsx('absolute inset-0 backdrop-blur-[1px]', styles.tinting)} />

      <div className="absolute top-0 left-0 w-full aspect-square flex justify-center items-center">
        <Logo size={SUN_RADIUS * 2 - 8} className="w-auto" type="icon" />
      </div>
    </div>
  );
});
