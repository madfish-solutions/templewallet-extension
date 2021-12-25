import { BigNumber } from 'bignumber.js';

import { RoutePairWithDirection } from '../interface/route-pair-with-direction.interface';
import { Trade, TradeOperation } from '../interface/trade.interface';
import { getPairFeeRatio } from './fee.utils';

const findSwapOutput = (aTokenAmount: BigNumber, pair: RoutePairWithDirection) => {
  const feeRatio = getPairFeeRatio(pair);

  const aTokenAmountWithFee = aTokenAmount.times(feeRatio);

  const numerator = aTokenAmountWithFee.times(pair.bTokenPool);
  const denominator = pair.aTokenPool.plus(aTokenAmountWithFee);

  return numerator.idiv(denominator);
};

const getTradeOperation = (aTokenAmount: BigNumber, pair: RoutePairWithDirection): TradeOperation => ({
  ...pair,
  aTokenAmount,
  bTokenAmount: findSwapOutput(aTokenAmount, pair)
});

export const calculateTradeExactIn = (inputAssetAmount: BigNumber, routePairs: RoutePairWithDirection[]) => {
  const trade: Trade = [];

  if (routePairs.length > 0) {
    const firstTradeOperation = getTradeOperation(inputAssetAmount, routePairs[0]);
    trade.push(firstTradeOperation);

    if (routePairs.length > 1) {
      for (let i = 1; i < routePairs.length; i++) {
        const previousTradeOutput = trade[i - 1].bTokenAmount;

        const tradeOperation = getTradeOperation(previousTradeOutput, routePairs[0]);
        trade.push(tradeOperation);
      }
    }
  }

  return trade;
};
