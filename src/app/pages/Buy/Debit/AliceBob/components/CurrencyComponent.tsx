import React, { forwardRef } from 'react';

import classNames from 'clsx';
import { browser } from 'webextension-polyfill-ts';

import { ReactComponent as ChevronDownIcon } from 'app/icons/chevron-down.svg';

interface Props {
  onPress?: () => void;
  label: string;
  type?: string;
  short?: boolean;
  className?: string;
}

export const CurrencyComponent = forwardRef<HTMLDivElement, Props>(
  ({ onPress, label, type, short = false, className }, ref) => (
    <div
      style={
        type === 'coinSelector'
          ? { paddingLeft: 10 }
          : type === 'fiatSelector'
          ? { padding: '5px 16px' }
          : { padding: '5px 0 5px 10px' }
      }
      onClick={onPress}
      ref={ref}
      className={classNames(
        'flex item-center justify-start w-full',
        type === 'coinSelector' && 'cursor-pointer',
        className
      )}
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
      {type === 'coinSelector' && <ChevronDownIcon className="w-4 h-auto text-gray-700 stroke-current stroke-2" />}
    </div>
  )
);
