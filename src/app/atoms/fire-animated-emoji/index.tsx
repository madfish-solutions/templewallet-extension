import React, { memo } from 'react';

import { Lottie } from 'lib/ui/react-lottie';

import fireAnimation from './fire-animation.json';

const FIRE_ANIMATION_OPTIONS = {
  loop: true,
  autoplay: true,
  animationData: fireAnimation,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice'
  }
} as const;

interface FireAnimatedEmojiProps {
  size?: number;
  style?: React.CSSProperties;
}

export const FireAnimatedEmoji = memo<FireAnimatedEmojiProps>(({ size = 16, style }) => (
  <Lottie
    isClickToPauseDisabled
    options={FIRE_ANIMATION_OPTIONS}
    height={size}
    width={size}
    style={{ margin: 0, cursor: 'default', ...style }}
  />
));
