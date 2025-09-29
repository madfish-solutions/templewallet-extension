import React, { memo } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import { toPercentage } from 'lib/ui/utils';

import { DollarValue } from './dollar-value';

interface PnlViewProps {
  value: BigNumber;
  pnlRate: BigNumber;
  decimalPlaces?: number;
}

export const PnlView = memo<PnlViewProps>(({ value, pnlRate, decimalPlaces }) => (
  <span className={clsx(value.gt(0) ? 'text-success' : 'text-error', 'whitespace-nowrap')}>
    <DollarValue withSign>{value}</DollarValue> ({pnlRate.gt(0) ? '+' : pnlRate.lt(0) ? '-' : ''}
    {toPercentage(pnlRate, undefined, decimalPlaces)})
  </span>
));
