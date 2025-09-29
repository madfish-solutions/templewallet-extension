import React, { memo } from 'react';

import BigNumber from 'bignumber.js';

import { Money } from 'app/atoms';

export const DollarValue = memo<{ children: BigNumber.Value; withSign?: boolean }>(({ children, withSign }) => (
  <span className="whitespace-nowrap">
    <Money fiat smallFractionFont={false} roundingMode={BigNumber.ROUND_HALF_UP} withSign={withSign}>
      {children}
    </Money>
    {' $'}
  </span>
));
