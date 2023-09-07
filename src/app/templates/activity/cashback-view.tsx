import React, { FC } from 'react';

import BigNumber from 'bignumber.js';

import Money from 'app/atoms/Money';
import { TEMPLE_TOKEN_SLUG } from 'lib/assets';
import { useAssetFiatCurrencyPrice, useFiatCurrency } from 'lib/fiat-currency';
import { useAssetMetadata } from 'lib/metadata';
import { atomsToTokens } from 'lib/temple/helpers';

interface Props {
  cashback: BigNumber;
}

export const CashbackView: FC<Props> = ({ cashback }) => {
  const { selectedFiatCurrency } = useFiatCurrency();

  const tkeyMetadata = useAssetMetadata(TEMPLE_TOKEN_SLUG);
  const tkeyPrice = useAssetFiatCurrencyPrice(TEMPLE_TOKEN_SLUG);

  const cashbackDisplayableValue = atomsToTokens(cashback, tkeyMetadata?.decimals ?? 0);
  const cashbackInFiat = cashbackDisplayableValue.times(tkeyPrice ?? 0);

  return (
    <div className="flex flex-row items-center">
      <div className="flex flex-1 flex-col items-right">
        <div className="inline-flex text-right justify-end font-medium text-green-500">
          <span>
            {'+ '}
            <Money forceUseFormattingThreshold smallFractionFont={false}>
              {cashbackDisplayableValue}
            </Money>{' '}
            {tkeyMetadata?.symbol}
          </span>
        </div>
        <div className="text-gray-500 text-xs leading-5 text-right">
          <Money fiat smallFractionFont={false}>
            {cashbackInFiat}
          </Money>{' '}
          {selectedFiatCurrency.symbol}
        </div>
      </div>
    </div>
  );
};
