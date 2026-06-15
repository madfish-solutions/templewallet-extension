import { FC } from 'react';

import { Lottie, LottieProps } from 'lib/ui/react-lottie';

import rewardsAnimation from './rewards-animation.json';

interface RewardsAnimationProps extends Omit<LottieProps, 'options'> {
  loop: boolean;
}

export const RewardsAnimation: FC<RewardsAnimationProps> = ({ loop }) => (
  <Lottie
    options={{
      loop,
      autoplay: true,
      animationData: rewardsAnimation,
      rendererSettings: { preserveAspectRatio: 'xMidYMid slice' }
    }}
  />
);
