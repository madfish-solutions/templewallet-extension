import { BigNumber } from 'bignumber.js';

import { RoutePairWithDirection } from '../interface/route-pair-with-direction.interface';
import { Trade } from '../interface/trade.interface';
import { getTradeFakeFee } from './fee.utils';
import { calculateTradeExactIn } from './trade.utils';

export const getTradeOutput = (trade: Trade) => trade[trade.length - 1]?.bTokenAmount ?? new BigNumber(0);

const isTradeBetter = (firstTrade: Trade, secondTrade: Trade) => {
  const firstTradeOutput = getTradeOutput(firstTrade);
  const firstTradeFakeFee = getTradeFakeFee(firstTrade);

  const secondTradeOutput = getTradeOutput(secondTrade);
  const secondTradeFakeFee = getTradeFakeFee(secondTrade);

  // TODO: take fakeFee into account
  return firstTradeOutput.isGreaterThan(secondTradeOutput);
};

export const getBestTradeExactIn = (
  inputAssetAmount: BigNumber,
  routePairsCombinations: Array<RoutePairWithDirection[]>
) => {
  let bestTradeExactIn: Trade = [];

  for (let routePairs of routePairsCombinations) {
    const trade = calculateTradeExactIn(inputAssetAmount, routePairs);

    if (isTradeBetter(trade, bestTradeExactIn)) {
      bestTradeExactIn = trade;
    }
  }

  return bestTradeExactIn;
};
