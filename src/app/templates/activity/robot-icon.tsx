import React, { FC } from 'react';

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
    style={{ borderRadius: '0.375rem', minWidth: '2.25rem', backgroundColor: 'white' }}
    className={className}
  />
);
