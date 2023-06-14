import React, { FC } from 'react';

import { isDefined } from '@rnw-community/shared';
import BigNumber from 'bignumber.js';

import { toLocalFormat } from 'lib/i18n';

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
