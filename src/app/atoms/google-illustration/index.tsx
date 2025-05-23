import React, { SVGProps, memo } from 'react';

import clsx from 'clsx';

import { Lottie } from 'lib/ui/react-lottie';

import styles from './google-illustration.module.css';
import { ReactComponent as IllustrationTemplate } from './illustration.svg';
import loadingAnimation from './loading-animation.json';

export type GoogleIllustrationState = 'error' | 'success' | 'active';

interface GoogleIllustrationProps extends SVGProps<SVGSVGElement> {
  state: GoogleIllustrationState;
}

const activeIllustrationAnimationOptions = {
  loop: true,
  autoplay: true,
  animationData: loadingAnimation,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice'
  }
};

export const GoogleIllustration = memo<GoogleIllustrationProps>(({ state, className, ...props }) => (
  <div className={clsx(className, 'relative')}>
    <IllustrationTemplate className={styles[state]} {...props} />
    {state === 'active' && (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <Lottie isClickToPauseDisabled options={activeIllustrationAnimationOptions} width={283.3} height={283.3} />
      </div>
    )}
  </div>
));
