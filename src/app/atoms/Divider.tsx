import React, { FC } from 'react';

interface DividerProps {
  style?: React.CSSProperties;
  className?: string;
}

const Divider: FC<DividerProps> = ({ style, className }) => (
  <div
    style={{
      width: '100%',
      height: '1px',
      backgroundColor: '#E2E8F0',
      ...style
    }}
    className={className}
  />
);

export default Divider;
