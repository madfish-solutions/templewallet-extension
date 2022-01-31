import React, { FC, useMemo } from 'react';

import { BigNumber } from 'bignumber.js';
import { DexTypeEnum, getPairFeeRatio, getTradeInputAmount, getTradeOutputAmount, Trade } from 'swap-router-sdk';

interface Props {
  trade: Trade;
}

export const SwapPriceImpact: FC<Props> = ({ trade }) => {
  const priceImpact = useMemo(() => {
    const tradeInput = getTradeInputAmount(trade);
    const tradeOutput = getTradeOutputAmount(trade);

    if (tradeInput && tradeOutput && !tradeInput.isEqualTo(0) && !tradeOutput.isEqualTo(0)) {
      const linearOutputMutezAmount = trade.reduce((previousTradeOutput, tradeOperation) => {
        const feeRatio = getPairFeeRatio(tradeOperation);

        const aTokenMultiplier = tradeOperation.aTokenMultiplier ?? new BigNumber(1);
        const bTokenMultiplier = tradeOperation.bTokenMultiplier ?? new BigNumber(1);

        const linearExchangeRate =
          tradeOperation.dexType === DexTypeEnum.Youves
            ? aTokenMultiplier.dividedBy(bTokenMultiplier)
            : tradeOperation.bTokenPool.dividedBy(tradeOperation.aTokenPool);

        return previousTradeOutput.multipliedBy(feeRatio).multipliedBy(linearExchangeRate).dividedToIntegerBy(1);
      }, tradeInput);

      return new BigNumber(100).minus(new BigNumber(100).multipliedBy(tradeOutput.dividedBy(linearOutputMutezAmount)));
    }

    return undefined;
  }, [trade]);

  return <span>{priceImpact ? `${priceImpact.toFixed(2)}%` : '-'}</span>;
};
