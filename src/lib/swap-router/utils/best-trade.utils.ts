import { BigNumber } from 'bignumber.js';

import { RoutePairWithDirection } from '../interface/route-pair-with-direction.interface';
import { Trade, TradeOperation } from '../interface/trade.interface';
import { getTradeFakeFee } from './fee.utils';
import { calculateTradeExactInput, calculateTradeExactOutput } from './trade.utils';

export const getTradeOutputAmount = (trade: Trade): BigNumber | undefined => trade[trade.length - 1]?.bTokenAmount;

export const getTradeInputOperation = (trade: Trade): TradeOperation | undefined => trade[0];

export const getTradeInputAmount = (trade: Trade): BigNumber | undefined => getTradeInputOperation(trade)?.aTokenAmount;

const isTradeOutputBetter = (firstTrade: Trade, secondTrade: Trade) => {
  const firstTradeOutput = getTradeOutputAmount(firstTrade);
  const firstTradeFakeFee = getTradeFakeFee(firstTrade);

  const secondTradeOutput = getTradeOutputAmount(secondTrade);
  const secondTradeFakeFee = getTradeFakeFee(secondTrade);

  if (firstTradeOutput && secondTradeOutput) {
    // TODO: take fakeFee into account
    return firstTradeOutput.isGreaterThan(secondTradeOutput);
  }

  if (firstTradeOutput) {
    return true;
  }

  return false;
};

const isTradeInputBetter = (firstTrade: Trade, secondTrade: Trade) => {
  const firstTradeInput = getTradeInputAmount(firstTrade);
  const firstTradeFakeFee = getTradeFakeFee(firstTrade);

  const secondTradeInput = getTradeInputAmount(secondTrade);
  const secondTradeFakeFee = getTradeFakeFee(secondTrade);

  if (firstTradeInput && secondTradeInput) {
    // TODO: take fakeFee into account
    return firstTradeInput.isLessThan(secondTradeInput);
  }

  if (firstTradeInput) {
    return true;
  }

  return false;
};

export const getBestTradeExactInput = (
  inputAssetAmount: BigNumber,
  routePairsCombinations: Array<RoutePairWithDirection[]>
) => {
  let bestTradeExactInput: Trade = [];

  for (let routePairs of routePairsCombinations) {
    const trade = calculateTradeExactInput(inputAssetAmount, routePairs);

    if (isTradeOutputBetter(trade, bestTradeExactInput)) {
      bestTradeExactInput = trade;
    }
  }

  return bestTradeExactInput;
};

export const getBestTradeExactOutput = (
  outputAssetAmount: BigNumber,
  routePairsCombinations: Array<RoutePairWithDirection[]>
) => {
  let bestTradeExactOutput: Trade = [];

  for (let routePairs of routePairsCombinations) {
    const trade = calculateTradeExactOutput(outputAssetAmount, routePairs);

    if (isTradeInputBetter(trade, bestTradeExactOutput)) {
      bestTradeExactOutput = trade;
    }
  }

  return bestTradeExactOutput;
};
