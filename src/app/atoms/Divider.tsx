import React, { FC } from 'react';

import clsx from 'clsx';

interface DividerProps {
  style?: React.CSSProperties;
  className?: string;
}

const Divider: FC<DividerProps> = ({ style, className }) => (
  <div
    style={{
      height: '1px',
      ...style
    }}
    className={clsx('w-auto bg-lines', className)}
  />
);

export default Divider;
