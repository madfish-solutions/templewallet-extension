import React, { FC } from 'react';

import classNames from 'clsx';
import { ListRowProps } from 'react-virtualized';

import { getAssetSymbolToDisplay } from 'lib/buy-with-credit-card/get-asset-symbol-to-display';

import { StaticCurrencyImage } from '../StaticCurrencyImage';
import { CurrencyBase } from '../types';
import { getProperNetworkFullName } from '../utils';

interface Props extends Partial<Pick<ListRowProps, 'style'>> {
  isFiat?: boolean;
  currency: CurrencyBase;
  isSelected: boolean;
  fitIcons?: boolean | ((currency: CurrencyBase) => boolean);
  onClick?: (newValue: CurrencyBase) => void;
}

export const CurrencyOption: FC<Props> = ({ currency, isFiat, isSelected, fitIcons, style, onClick }) => (
  <button
    type="button"
    style={style}
    className={classNames('py-3 px-4 w-full flex items-center', isSelected ? 'bg-gray-200' : 'hover:bg-gray-100')}
    onClick={onClick && (() => onClick(currency))}
  >
    <StaticCurrencyImage
      currencyCode={currency.code}
      isFiat={isFiat}
      imageSrc={currency.icon}
      fitImg={typeof fitIcons === 'function' ? fitIcons(currency) : fitIcons}
      className="mr-2"
    />

    <div className="flex-1 flex flex-col items-stretch">
      <div className="text-gray-910 text-lg text-left">{getAssetSymbolToDisplay(currency)}</div>

      <div className="flex text-xs">
        <span className="text-gray-600 mr-2">{currency.name}</span>
        <span className="flex-1" />
        <span className="text-indigo-500">{getProperNetworkFullName(currency)}</span>
      </div>
    </div>
  </button>
);
