import React, { FC } from 'react';

interface BtnProps extends PropsWithChildren {
  label?: string;
  disabled?: boolean;
  onClick: () => void;
}

export const Btn: FC<BtnProps> = ({ label, disabled = false, onClick, children }) => (
  <button
    className={disabled ? 'vp-disabled-btn' : `vp-btn${label ? ' label' : ''}`}
    data-label={label}
    disabled={disabled}
    onClick={onClick}
  >
    {children}
  </button>
);
