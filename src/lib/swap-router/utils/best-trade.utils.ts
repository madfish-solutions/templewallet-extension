import { BigNumber } from 'bignumber.js';

import { RoutePairWithDirection } from '../interface/route-pair-with-direction.interface';
import { Trade } from '../interface/trade.interface';
import { getTradeFakeFee } from './fee.utils';
import { calculateTradeExactInput, calculateTradeExactOutput } from './trade.utils';

export const getTradeOutput = (trade: Trade): BigNumber | undefined => trade[trade.length - 1]?.bTokenAmount;

export const getTradeInput = (trade: Trade): BigNumber | undefined => trade[0]?.aTokenAmount;

const isTradeOutputBetter = (firstTrade: Trade, secondTrade: Trade) => {
  const firstTradeOutput = getTradeOutput(firstTrade);
  const firstTradeFakeFee = getTradeFakeFee(firstTrade);

  const secondTradeOutput = getTradeOutput(secondTrade);
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
  const firstTradeInput = getTradeInput(firstTrade);
  console.log(firstTradeInput?.toFixed());
  const firstTradeFakeFee = getTradeFakeFee(firstTrade);

  const secondTradeInput = getTradeInput(secondTrade);
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
