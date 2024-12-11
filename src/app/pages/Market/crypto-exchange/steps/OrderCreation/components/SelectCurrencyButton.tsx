import React, { memo } from 'react';

import { Button, IconBase } from 'app/atoms';
import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';
import { StoredExolixCurrency } from 'app/store/crypto-exchange/state';

import { getCurrencyDisplayCode } from '../../../utils';

import { CurrencyIcon } from './CurrencyIcon';

interface Props {
  currency: StoredExolixCurrency;
  onClick?: EmptyFn;
}

export const SelectCurrencyButton = memo<Props>(({ currency, onClick }) => (
  <Button
    className="cursor-pointer flex justify-between items-center bg-white py-0.5 px-2 gap-x-1 rounded-8 w-[144px] h-[44px]"
    onClick={onClick}
  >
    <div className="flex items-center gap-x-2">
      <CurrencyIcon src={currency.icon} code={currency.code} />
      <div className="text-start">
        <p className="text-font-description-bold">{getCurrencyDisplayCode(currency.code)}</p>
        <p className="text-font-num-12 text-grey-1 w-[52px] truncate">{currency.network.fullName}</p>
      </div>
    </div>
    <IconBase Icon={CompactDown} className="text-primary" size={16} />
  </Button>
));
