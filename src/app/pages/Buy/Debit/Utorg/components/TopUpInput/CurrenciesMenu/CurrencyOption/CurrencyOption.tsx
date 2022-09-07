import React, { FC } from 'react';

import classNames from 'clsx';
import { ListRowProps } from 'react-virtualized';

import { StaticCurrencyImage } from '../../StaticCurrencyImage/StaticCurrencyImage';

interface Props extends Partial<Pick<ListRowProps, 'style'>> {
  currencyName: string;
  isSelected: boolean;
  onClick: (newValue: string) => void;
}

export const CurrencyOption: FC<Props> = ({ currencyName, isSelected, style, onClick }) => (
  <button
    type="button"
    style={style}
    className={classNames('p-4 w-full flex items-center', isSelected && 'bg-gray-200')}
    onClick={() => onClick(currencyName)}
  >
    <StaticCurrencyImage
      currencyName={currencyName}
      style={{
        borderRadius: '50%',
        width: 32,
        height: 32
      }}
    />
    <div className="flex flex-col ml-2 text-left">
      <div className="flex items-center">
        <span className="text-gray-700 mr-2 font-medium" style={{ fontSize: 17 }}>
          {currencyName}
        </span>
      </div>
    </div>
  </button>
);
