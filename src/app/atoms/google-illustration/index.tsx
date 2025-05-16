import React, { SVGProps, memo } from 'react';

import clsx from 'clsx';

import styles from './google-illustration.module.css';
import { ReactComponent as IllustrationTemplate } from './illustration.svg';

export type GoogleIllustrationState = 'error' | 'success' | 'active';

interface GoogleIllustrationProps extends SVGProps<SVGSVGElement> {
  state: GoogleIllustrationState;
}

export const GoogleIllustration = memo<GoogleIllustrationProps>(({ state, className, ...props }) => (
  <IllustrationTemplate className={clsx(styles[state], className)} {...props} />
));
