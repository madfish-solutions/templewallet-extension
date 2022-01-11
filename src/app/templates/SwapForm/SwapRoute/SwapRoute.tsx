import React, { FC } from 'react';

import { Trade } from 'lib/swap-router/interface/trade.interface';

import { SwapInputValue } from '../SwapForm.form';
import { SwapRouteInfo } from './SwapRouteItem/SwapRouteInfo/SwapRouteInfo';
import { SwapRouteItem } from './SwapRouteItem/SwapRouteItem';

interface Props {
  trade: Trade;
  inputValue: SwapInputValue;
  outputValue: SwapInputValue;
}

export const SwapRoute: FC<Props> = ({ trade, inputValue, outputValue }) => {
  if (!inputValue.assetSlug || !outputValue.assetSlug) {
    return <SwapRouteInfo text="Please, select tokens to swap" />;
  }

  if (!inputValue.amount && !outputValue.amount) {
    return <SwapRouteInfo text="Please, enter swap amount" />;
  }

  if (trade.length === 0) {
    return <SwapRouteInfo text="No quotes available!" />;
  }

  return (
    <div className="flex justify-between items-center mb-2">
      {trade.map((item, index) => (
        <SwapRouteItem
          key={`${index}_${item.dexType}_${item.aTokenSlug}_${item.bTokenSlug}`}
          tradeOperation={item}
          isShowNextArrow={index !== trade.length - 1}
        />
      ))}
    </div>
  );
};
