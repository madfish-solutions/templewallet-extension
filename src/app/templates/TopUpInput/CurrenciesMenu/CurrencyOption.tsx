import React, { FC } from 'react';

import classNames from 'clsx';
import { ListRowProps } from 'react-virtualized';

import { getAssetSymbolToDisplay } from 'lib/buy-with-credit-card/get-asset-symbol-to-display';

import { StaticCurrencyImage } from '../StaticCurrencyImage';
import { CurrencyBase } from '../types';
import { getProperNetworkFullName } from '../utils';

interface Props extends Partial<Pick<ListRowProps, 'style'>> {
  currency: CurrencyBase;
  isSelected: boolean;
  fitIcons?: boolean | ((currency: CurrencyBase) => boolean);
}

export const CurrencyOption: FC<Props> = ({ currency, isSelected, fitIcons }) => (
  <div
    className={classNames(
      'py-1.5 px-2 w-full flex items-center h-16',
      isSelected ? 'bg-gray-200' : 'hover:bg-gray-100'
    )}
  >
    <StaticCurrencyImage
      currencyCode={currency.code}
      isFiat={Boolean(currency.network)}
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
  </div>
);
