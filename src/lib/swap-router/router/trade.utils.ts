import { BigNumber } from 'bignumber.js';

import assert from 'lib/assert';

import { areTokensEqual } from '../utils/token.utils';
import { TradeInterface } from './trade.interface';

// comparator function that allows sorting trades by their output amounts, in decreasing order, and then input amounts
// in increasing order. i.e. the best trades have the most outputs for the least inputs and are sorted first
const inputOutputComparator = (a: TradeInterface, b: TradeInterface): number => {
  // must have same input and output token for comparison
  assert(areTokensEqual(a.inputToken, b.inputToken), 'INPUT_CURRENCY');
  assert(areTokensEqual(a.outputToken, b.outputToken), 'OUTPUT_CURRENCY');

  if (a.outputAmount.isEqualTo(b.outputAmount)) {
    if (a.inputAmount.isEqualTo(b.inputAmount)) {
      return 0;
    }
    // trade A requires less input than trade B, so A should come first
    if (a.inputAmount.isLessThan(b.inputAmount)) {
      return -1;
    } else {
      return 1;
    }
  } else {
    // tradeA has less output than trade B, so should come second
    if (a.outputAmount.isLessThan(b.outputAmount)) {
      return 1;
    } else {
      return -1;
    }
  }
};

// extension of the input output comparator that also considers other dimensions of the trade in ranking them
export const tradeComparator = (a: TradeInterface, b: TradeInterface) => {
  const ioComp = inputOutputComparator(a, b);
  if (ioComp !== 0) {
    return ioComp;
  }

  // consider lowest slippage next, since these are less likely to fail
  // if (a.priceImpact.lessThan(b.priceImpact)) {
  //   return -1;
  // } else if (a.priceImpact.greaterThan(b.priceImpact)) {
  //   return 1;
  // }

  // finally consider the number of hops since each hop costs gas
  return a.route.length - b.route.length;
};

const getTradeExecutionPrice = (trade: TradeInterface) => new BigNumber(443).multipliedBy(trade.route.length);

const BETTER_TRADE_LESS_HOPS_THRESHOLD = 0.5 / 100;

// returns whether tradeB is better than tradeA by at least a threshold percentage amount
export const isTradeBetter = (
  tradeA: TradeInterface | undefined | null,
  tradeB: TradeInterface | undefined | null
): boolean | undefined => {
  if (tradeA && !tradeB) return false;
  if (tradeB && !tradeA) return true;
  if (!tradeA || !tradeB) return undefined;

  if (
    tradeA.type !== tradeB.type ||
    !areTokensEqual(tradeA.inputToken, tradeB.inputToken) ||
    !areTokensEqual(tradeA.outputToken, tradeB.outputToken)
  ) {
    throw new Error('Comparing incomparable trades');
  }

  return getTradeExecutionPrice(tradeA)
    .multipliedBy(BETTER_TRADE_LESS_HOPS_THRESHOLD)
    .isLessThan(getTradeExecutionPrice(tradeB));
};
