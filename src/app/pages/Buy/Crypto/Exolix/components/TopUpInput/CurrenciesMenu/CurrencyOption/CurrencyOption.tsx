import React, { FC } from 'react';

import classNames from 'clsx';
import { ListRowProps } from 'react-virtualized';

import { CurrencyInterface } from '../../../../exolix.interface';
import { getProperNetworkFullName } from '../../../../exolix.util';
import { StaticCurrencyImage } from '../../StaticCurrencyImage/StaticCurrencyImage';

interface Props extends Partial<Pick<ListRowProps, 'style'>> {
  currency: CurrencyInterface;
  isSelected: boolean;
  onClick: (newValue: CurrencyInterface) => void;
}

export const CurrencyOption: FC<Props> = ({ currency, isSelected, style, onClick }) => (
  <button
    type="button"
    style={style}
    className={classNames('p-4 w-full flex items-center', isSelected && 'bg-gray-200')}
    onClick={() => onClick(currency)}
  >
    <StaticCurrencyImage
      currencyCode={currency.code}
      imageSrc={currency.icon}
      style={{
        borderRadius: '50%',
        width: 32,
        height: 32
      }}
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
