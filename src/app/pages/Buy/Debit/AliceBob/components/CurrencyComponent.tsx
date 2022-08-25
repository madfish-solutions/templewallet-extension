import React, { forwardRef } from 'react';

import classNames from 'clsx';
import { browser } from 'webextension-polyfill-ts';

interface Props {
  onPress?: () => void;
  label: string;
  short?: boolean;
  className?: string;
}

export const CurrencyComponent = forwardRef<HTMLDivElement, Props>(
  ({ onPress, label, short = false, className }, ref) => (
    <div
      style={{ padding: '5px 16px' }}
      onClick={onPress}
      ref={ref}
      className={classNames('flex item-center justify-start w-full', className)}
    >
      <img
        alt="icon"
        className="w-8 h-8"
        style={{ borderRadius: '50%' }}
        src={browser.runtime.getURL('misc/fiat-logos/' + label.toLowerCase() + '.svg')}
      />
      <p
        className="font-inter text-gray-700 pl-2 overflow-hidden"
        style={{ fontSize: 17, marginTop: 5, textOverflow: 'ellipsis' }}
      >
        {short && label.length > 4 ? `${label.substr(0, 3)}…` : label}
      </p>
    </div>
  )
);
