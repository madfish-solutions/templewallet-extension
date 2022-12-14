import React, { FC } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import { T } from 'lib/i18n';
import { navigate } from 'lib/woozie';

import modStyles from '../../Tokens.module.css';

export const DelegateTezosTag: FC = () => (
  <Button
    onClick={e => {
      e.preventDefault();
      e.stopPropagation();
      navigate('/explore/tez/?tab=delegation');
    }}
    className={classNames('ml-2 px-2 py-1', modStyles['yieldTag'])}
  >
    <T id="delegate" />
  </Button>
);
