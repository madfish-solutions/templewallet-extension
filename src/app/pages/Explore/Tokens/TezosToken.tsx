import React, { FC } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import { T } from 'lib/i18n/react';
import { navigate } from 'lib/woozie';

import styles from './Tokens.module.css';

export const TezosToken: FC = () => (
  <Button
    onClick={e => {
      e.preventDefault();
      e.stopPropagation();
      navigate('/explore/tez/?tab=delegation');
    }}
    className={classNames('ml-2 px-2 py-1', styles['apyBadge'])}
  >
    {<T id="delegate" />}
  </Button>
);
