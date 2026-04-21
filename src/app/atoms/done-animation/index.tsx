import { FC, ReactNode } from 'react';

import clsx from 'clsx';

import { Lottie } from 'lib/ui/react-lottie';

import backgroundSuccessSrc from './background-success.svg?url';
import doneAnimation from './done-animation.json';

const DONE_ANIMATION_OPTIONS = {
  loop: false,
  autoplay: true,
  animationData: doneAnimation,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice'
  }
} as const;

interface Props {
  overlay?: ReactNode;
  animationSize?: number;
  animationSpeed?: number;
  className?: string;
}

export const DoneAnimation: FC<Props> = ({ overlay, animationSize = 148, animationSpeed = 0.8, className }) => (
  <div className={clsx('relative flex items-center justify-center overflow-hidden', className)}>
    <img src={backgroundSuccessSrc} alt="" className="w-full h-auto" />

    {overlay}

    <div className="absolute">
      <Lottie
        isClickToPauseDisabled
        options={DONE_ANIMATION_OPTIONS}
        height={animationSize}
        width={animationSize}
        speed={animationSpeed}
      />
    </div>
  </div>
);
