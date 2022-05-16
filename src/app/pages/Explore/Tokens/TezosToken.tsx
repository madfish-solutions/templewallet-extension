import React, { FC } from 'react';

import classNames from 'clsx';

import { T } from 'lib/i18n/react';
import { Link } from 'lib/woozie';

import styles from './Tokens.module.css';

export const TezosToken: FC = () => (
  <Link to="/explore/tez/?tab=delegation" className={classNames('ml-1 px-2 py-1', styles['apyBadge'])}>
    {<T id="delegate" />}
  </Link>
);
