import React, { FC } from 'react';

import classNames from 'clsx';

import Identicon from 'app/atoms/Identicon';

interface Props {
  hash: string;
  className?: string;
}

export const RobotIcon: FC<Props> = ({ hash, className }) => (
  <Identicon
    type="bottts"
    hash={hash}
    size={36}
    style={{ backgroundColor: 'white' }}
    className={classNames('rounded-md min-w-9', className)}
  />
);
