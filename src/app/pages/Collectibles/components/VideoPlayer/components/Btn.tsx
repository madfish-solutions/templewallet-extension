import React, { FC } from 'react';

interface BtnProps extends PropsWithChildren {
  label?: string;
  onClick: () => void;
}

export const Btn: FC<BtnProps> = ({ label, onClick, children }) => (
  <button className={`vp-btn${label ? ' label' : ''}`} data-label={label} onClick={onClick}>
    {children}
  </button>
);
