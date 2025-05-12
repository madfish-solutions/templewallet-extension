import React, { SVGProps, memo } from 'react';

import clsx from 'clsx';

import { AuthState } from '../../types';

import styles from './auth-illustration.module.css';
import { ReactComponent as IllustrationTemplate } from './illustration.svg';

interface AuthIllustrationProps extends SVGProps<SVGSVGElement> {
  state: AuthState;
}

export const AuthIllustration = memo<AuthIllustrationProps>(({ state, className, ...props }) => (
  <IllustrationTemplate className={clsx(styles[state], className)} {...props} />
));
