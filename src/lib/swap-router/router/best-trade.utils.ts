import { BigNumber } from 'bignumber.js';

import assert from 'lib/assert';

import { TradeTypeEnum } from '../enum/trade-type.enum';
import { PairLiquidityInterface } from '../pair-liquidity.interface';
import { TokenInterface } from '../token.interface';
import { areTokensEqual } from '../utils/token.utils';
import { sortedInsert } from './array.utils';
import { findSwapOutput } from './swap.utils';
import { TradeInterface } from './trade.interface';
import { tradeComparator } from './trade.utils';

export const ZERO = 0;

export const bestTradeExactIn = (
  allPairs: PairLiquidityInterface[],
  inputToken: TokenInterface,
  inputAmount: BigNumber,
  outputToken: TokenInterface,
  { maxHops, maxNumResults }: { maxHops: number; maxNumResults: number },
  // used in recursion
  currentPairs: PairLiquidityInterface[] = [],
  nextInputToken: TokenInterface = inputToken,
  nextInputAmount: BigNumber = inputAmount,
  bestTrades: TradeInterface[] = []
): TradeInterface[] => {
  assert(allPairs.length > 0, 'PAIRS');
  assert(maxHops > 0, 'MAX_HOPS');
  assert(areTokensEqual(inputToken, nextInputToken) || currentPairs.length > 0, 'INVALID_RECURSION');

  function getPairFee(pair: PairLiquidityInterface) {}

  for (let i = 0; i < allPairs.length; i++) {
    const pair = allPairs[i];

    // pair irrelevant
    if (!areTokensEqual(pair.aToken, nextInputToken) && !areTokensEqual(pair.bToken, nextInputToken)) continue;
    if (pair.aTokenPool.isEqualTo(ZERO) || pair.bTokenPool.isEqualTo(ZERO)) continue;

    // @ts-ignore
    const bTokenOutput = findSwapOutput(nextInputAmount, pair.aTokenPool, pair.bTokenPool, getPairFee(pair));

    // we have arrived at the output token, so this is the final trade of one of the paths
    if (areTokensEqual(pair.bToken, outputToken)) {
      sortedInsert(
        bestTrades,
        {
          type: TradeTypeEnum.EXACT_INPUT,
          route: [...currentPairs, pair],
          outputToken: pair.bToken,
          outputAmount: bTokenOutput,
          inputAmount,
          inputToken
        },
        maxNumResults,
        tradeComparator
      );
    } else if (maxHops > 1 && allPairs.length > 1) {
      const allPairsExcludingThisPair = allPairs.slice(0, i).concat(allPairs.slice(i + 1, allPairs.length));

      // otherwise, consider all the other paths that lead from this token as long as we have not exceeded maxHops
      bestTradeExactIn(
        allPairsExcludingThisPair,
        inputToken,
        inputAmount,
        outputToken,
        {
          maxHops: maxHops - 1,
          maxNumResults
        },
        [...currentPairs, pair],
        pair.bToken,
        bTokenOutput,
        bestTrades
      );
    }
  }

  return bestTrades;
};
