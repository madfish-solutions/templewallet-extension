import React, { memo } from 'react';

import { CellPartProps } from 'app/templates/select-with-modal';
import { FiatCurrencyOption } from 'lib/fiat-currency';

export const CurrencyIcon = memo<CellPartProps<FiatCurrencyOption>>(({ option: { symbol } }) => (
  <div className="w-6 h-6 flex items-center justify-center bg-white border border-lines shadow-bottom rounded-full">
    <span className="text-grey-1 leading-5 font-medium text-[13px]">{symbol}</span>
  </div>
));
