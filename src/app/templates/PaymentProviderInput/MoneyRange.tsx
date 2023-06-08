import React, { FC } from 'react';

import BigNumber from 'bignumber.js';

import { toLocalFormat } from 'lib/i18n';
import { isDefined } from 'lib/utils/is-defined';

interface Props {
  minAmount?: BigNumber.Value;
  maxAmount?: BigNumber.Value;
  currencySymbol?: string;
  decimalPlaces?: number;
}

export const MoneyRange: FC<Props> = ({ minAmount, maxAmount, currencySymbol, decimalPlaces }) => (
  <span className="text-xs text-gray-600 leading-relaxed">
    {isDefined(minAmount) && isDefined(maxAmount) && isDefined(currencySymbol)
      ? `${toLocalFormat(minAmount ?? 0, { decimalPlaces })} - ${toLocalFormat(maxAmount, {
          decimalPlaces
        })} ${currencySymbol}`
      : '-'}
  </span>
);
