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

const findSwapInput = (bTokenAmount: BigNumber, pair: RoutePairWithDirection) => {
  const feeRatio = getPairFeeRatio(pair);

  const numerator = pair.aTokenPool.times(bTokenAmount);
  const denominator = pair.bTokenPool.minus(bTokenAmount).times(feeRatio);

  const input = numerator.idiv(denominator).plus(1);

  return input.isGreaterThan(0) ? input : new BigNumber(Infinity);
};

const getTradeOperationExactInput = (
  aTokenAmount: BigNumber,
  pair: RoutePairWithDirection,
  slippageToleranceRatio: number
): TradeOperation => ({
  ...pair,
  aTokenAmount,
  bTokenAmount: findSwapOutput(aTokenAmount.multipliedBy(slippageToleranceRatio), pair)
});

const getTradeOperationExactOutput = (bTokenAmount: BigNumber, pair: RoutePairWithDirection): TradeOperation => ({
  ...pair,
  bTokenAmount,
  aTokenAmount: findSwapInput(bTokenAmount, pair)
});

export const calculateTradeExactInput = (
  inputAssetAmount: BigNumber,
  routePairs: RoutePairWithDirection[],
  slippageTolerancePercent = 0
) => {
  const trade: Trade = [];

  if (routePairs.length > 0) {
    const slippageToleranceRatio = (100 - slippageTolerancePercent) / 100;
    const tradeOperationSlippageToleranceRatio = Math.pow(slippageToleranceRatio, 1 / routePairs.length);

    const firstTradeOperation = getTradeOperationExactInput(
      inputAssetAmount,
      routePairs[0],
      tradeOperationSlippageToleranceRatio
    );
    trade.push(firstTradeOperation);

    if (routePairs.length > 1) {
      for (let i = 1; i < routePairs.length; i++) {
        const previousTradeOutput = trade[i - 1].bTokenAmount;

        const tradeOperation = getTradeOperationExactInput(
          previousTradeOutput,
          routePairs[i],
          tradeOperationSlippageToleranceRatio
        );
        trade.push(tradeOperation);
      }
    }
  }

  return trade;
};

export const calculateTradeExactOutput = (outputAssetAmount: BigNumber, routePairs: RoutePairWithDirection[]) => {
  const trade: Trade = [];

  if (routePairs.length > 0) {
    const lastTradeIndex = routePairs.length - 1;

    const firstTradeOperation = getTradeOperationExactOutput(outputAssetAmount, routePairs[lastTradeIndex]);
    trade.unshift(firstTradeOperation);

    if (routePairs.length > 1) {
      for (let i = lastTradeIndex - 1; i >= 0; i--) {
        const previousTradeInput = trade[0].aTokenAmount;

        const tradeOperation = getTradeOperationExactOutput(previousTradeInput, routePairs[i]);
        trade.unshift(tradeOperation);
      }
    }
  }

  return trade;
};
