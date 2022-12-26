import React, { FC } from 'react';

import classNames from 'clsx';
import { ListRowProps } from 'react-virtualized';

import { StaticCurrencyImage } from '../StaticCurrencyImage';
import { CurrencyBase } from '../types';
import { getProperNetworkFullName } from '../utils';

interface Props extends Partial<Pick<ListRowProps, 'style'>> {
  currency: CurrencyBase;
  isSelected: boolean;
  fitIcons?: boolean;
  onClick?: (newValue: CurrencyBase) => void;
}

export const CurrencyOption: FC<Props> = ({ currency, isSelected, fitIcons, style, onClick }) => (
  <button
    type="button"
    style={style}
    className={classNames('p-4 w-full flex items-center', isSelected && 'bg-gray-200')}
    onClick={onClick && (() => onClick(currency))}
  >
    <StaticCurrencyImage
      currencyCode={currency.code}
      isFiat={Boolean(currency.network)}
      imageSrc={currency.icon}
      fitImg={fitIcons}
    />
    <div className="flex flex-col ml-2 text-left">
      <div className="flex items-center">
        <span className="text-gray-700 mr-2 font-medium" style={{ fontSize: 17 }}>
          {currency.code}
        </span>
        <span className="text-gray-500 text-sm font-normal">{currency.name}</span>
      </div>
      <span className="text-indigo-500 font-medium" style={{ fontSize: 11 }}>
        {getProperNetworkFullName(currency)}
      </span>
    </div>
  </button>
);
