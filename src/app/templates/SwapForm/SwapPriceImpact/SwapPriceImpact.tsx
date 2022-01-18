import React, { FC, useMemo } from 'react';

import { BigNumber } from 'bignumber.js';

import { Trade, getPairFeeRatio, getTradeInputAmount, getTradeOutputAmount } from 'lib/swap-router';

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
        const linearExchangeRate = tradeOperation.bTokenPool.dividedBy(tradeOperation.aTokenPool);

        return previousTradeOutput.multipliedBy(feeRatio).multipliedBy(linearExchangeRate).dividedToIntegerBy(1);
      }, tradeInput);

      return new BigNumber(100).minus(new BigNumber(100).multipliedBy(tradeOutput.dividedBy(linearOutputMutezAmount)));
    }

    return undefined;
  }, [trade]);

  return <span>{priceImpact ? `${priceImpact.toFixed(2)}%` : '-'}</span>;
};
