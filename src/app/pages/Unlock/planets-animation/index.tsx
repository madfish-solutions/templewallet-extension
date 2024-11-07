import React, { memo } from 'react';

import clsx from 'clsx';

import { Logo } from 'app/atoms/Logo';

import { SUN_RADIUS } from './constants';
import { Orbit } from './orbit';
import styles from './PlanetsAnimation.module.css';
import { ReactComponent as SunGlow } from './sun-glow.svg';
import { GlobalAnimationParamsProps, OrbitProps } from './types';

interface Props extends GlobalAnimationParamsProps {
  orbits: OrbitProps[];
}

export const PlanetsAnimation = memo<Props>(({ bottomGap, orbits }) => {
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
