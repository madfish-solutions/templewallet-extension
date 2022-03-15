import React, { forwardRef } from 'react';

import classNames from 'clsx';
import { browser } from 'webextension-polyfill-ts';

import { ReactComponent as ChevronDownIcon } from 'app/icons/chevron-down.svg';
import styles from 'app/pages/BuyCrypto/BuyCrypto.module.css';
import { AssetIcon } from 'app/templates/AssetIcon';

interface Props {
  onPress?: () => void;
  label: string;
  type?: string;
  short?: boolean;
  className?: string;
}

const customLogoCurrencyList = ['QUICK', '1INCH', 'DOGE', 'CAKE', 'SUSHI', 'SHIB'];

const CurrencyComponent = forwardRef<HTMLDivElement, Props>(
  ({ onPress, label, type, short = false, className }, ref) => {
    const compoundClassName = classNames(styles['currencySelector'], 'cursor-pointer', className);
    return (
      <div
        style={
          type === 'currencySelector' ? undefined : { margin: '5px 0', justifyContent: 'start', paddingLeft: '5px' }
        }
        onClick={onPress}
        ref={ref}
        className={compoundClassName}
      >
        {type === 'tezosSelector' ? <AssetIcon assetSlug="tez" size={32} /> : <RenderImage label={label} />}
        <p className={styles['currencyName']}>{short && label.length > 4 ? `${label.substr(0, 3)}…` : label}</p>
        {type === 'currencySelector' && (
          <ChevronDownIcon className="w-4 h-auto text-gray-700 stroke-current stroke-2" />
        )}
      </div>
    );
  }
);

export default CurrencyComponent;

interface RenderImageProps {
  label: string;
}

const RenderImage: React.FC<RenderImageProps> = ({ label }) =>
  customLogoCurrencyList.indexOf(label) === -1 ? (
    <img
      alt="icon"
      className={styles['currencyCircle']}
      src={browser.runtime.getURL('misc/token-logos/top-up-token-logos/' + label.toLowerCase() + '.png')}
    />
  ) : (
    <div className={styles['customCurrencyCircleWrapper']}>
      <img
        alt="icon"
        className={styles['customCurrencyCircle']}
        src={browser.runtime.getURL('misc/token-logos/top-up-token-logos/' + label.toLowerCase() + '.png')}
      />
    </div>
  );
