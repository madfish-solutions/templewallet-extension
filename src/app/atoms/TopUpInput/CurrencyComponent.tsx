import React, { forwardRef } from 'react';

import classNames from 'clsx';
import { browser } from 'webextension-polyfill-ts';

import { ReactComponent as ChevronDownIcon } from 'app/icons/chevron-down.svg';
import { AssetIcon } from 'app/templates/AssetIcon';

interface Props {
  onPress?: () => void;
  label: string;
  type?: string;
  short?: boolean;
  className?: string;
}

const customLogoCurrencyList = ['QUICK', '1INCH', 'DOGE', 'CAKE', 'SUSHI', 'SHIB'];

export const CurrencyComponent = forwardRef<HTMLDivElement, Props>(
  ({ onPress, label, type, short = false, className }, ref) => (
    <div
      style={
        type === 'coinSelector'
          ? { marginLeft: 10 }
          : type === 'fiatSelector'
          ? { margin: '5px 16px' }
          : { margin: '5px 0 5px 10px' }
      }
      onClick={onPress}
      ref={ref}
      className={classNames(
        'flex item-center justify-start w-full',
        type === 'coinSelector' && 'cursor-pointer',
        className
      )}
    >
      {type === 'tezosSelector' ? (
        <AssetIcon assetSlug="tez" size={32} />
      ) : (
        <RenderImage label={label} isFiat={type === 'fiatSelector'} />
      )}
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

interface RenderImageProps {
  label: string;
  isFiat?: boolean;
}

const RenderImage: React.FC<RenderImageProps> = ({ label, isFiat }) =>
  customLogoCurrencyList.indexOf(label) === -1 ? (
    isFiat ? (
      <img
        alt="icon"
        className="w-8 h-8"
        style={{ borderRadius: '50%' }}
        src={browser.runtime.getURL('misc/fiat-logos/' + label.toLowerCase() + '.svg')}
      />
    ) : (
      <img
        alt="icon"
        className="w-8 h-8"
        style={{ borderRadius: '50%' }}
        src={browser.runtime.getURL('misc/token-logos/top-up-token-logos/' + label.toLowerCase() + '.png')}
      />
    )
  ) : (
    <div
      className="flex justify-center items-center w-8 h-8 border-gray-600 border-solid"
      style={{ borderWidth: 1, borderRadius: '50%' }}
    >
      <img
        alt="icon"
        className="w-6 h-6"
        src={browser.runtime.getURL('misc/token-logos/top-up-token-logos/' + label.toLowerCase() + '.png')}
      />
    </div>
  );
