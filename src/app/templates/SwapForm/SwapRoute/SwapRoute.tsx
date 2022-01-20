import React, { FC } from 'react';

import { Trade } from 'swap-router-sdk';

import { t } from 'lib/i18n/react';

import { SwapInputValue } from '../SwapForm.form';
import { SwapRouteInfo } from './SwapRouteItem/SwapRouteInfo/SwapRouteInfo';
import { SwapRouteItem } from './SwapRouteItem/SwapRouteItem';

interface Props {
  trade: Trade;
  inputValue: SwapInputValue;
  outputValue: SwapInputValue;
  loadingHasFailed: boolean;
}

export const SwapRoute: FC<Props> = ({ trade, inputValue, outputValue, loadingHasFailed }) => {
  if (loadingHasFailed) {
    return <SwapRouteInfo text={t('swapRouteLoadingHasFailed')} className="text-red-700" />;
  }

  if (!inputValue.assetSlug || !outputValue.assetSlug) {
    return <SwapRouteInfo text={t('selectTokensToSwap')} />;
  }

  if (!inputValue.amount && !outputValue.amount) {
    return <SwapRouteInfo text={t('enterSwapAmount')} />;
  }

  if (trade.length === 0) {
    return <SwapRouteInfo text={t('noQuotesAvailable')} />;
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
