import React, { FC } from 'react';

export interface PaymentProviderTagProps {
  bgColor: string;
  text: string;
}

export const PaymentProviderTag: FC<PaymentProviderTagProps> = ({ bgColor, text }) => (
  <div className="rounded-10 h-5 px-2 flex items-center" style={{ backgroundColor: bgColor }}>
    <span className="text-xs text-white leading-none">{text}</span>
  </div>
);
