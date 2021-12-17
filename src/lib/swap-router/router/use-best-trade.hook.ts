import { useEffect, useMemo, useState } from 'react';

import { TezosToolkit } from '@taquito/taquito';
import { BigNumber } from 'bignumber.js';

import { PairLiquidityInterface } from '../pair-liquidity.interface';
import { TokenInterface } from '../token.interface';
import { getAllPairsLiquidity } from '../utils/pair-liquidity.utils';
import { getAllPairs } from '../utils/pair.utils';
import { bestTradeExactIn } from './best-trade.utils';
import { TradeTypeEnum } from './trade-type.enum';
import { isTradeBetter } from './trade.utils';

const MAX_HOPS = 3;

export const useBestTrade = (
  tradeType: TradeTypeEnum,
  inputToken: TokenInterface,
  outputToken: TokenInterface,
  specifiedAmount: BigNumber,
  tezos: TezosToolkit
) => {
  const [allPairs, setAllPairs] = useState<PairLiquidityInterface[]>([]);

  useEffect(() => {
    (async () => {
      const pairs = await getAllPairs(tezos);
      const pairsLiquidity = await getAllPairsLiquidity(pairs);

      setAllPairs(pairsLiquidity);
    })();
  }, [tezos]);

  return useMemo(() => {
    let bestTradeSoFar = null;

    for (let i = 1; i <= MAX_HOPS; i++) {
      try {
        const options = { maxHops: i, maxNumResults: 1 };

        let currentTrade = null;
        if (tradeType === TradeTypeEnum.EXACT_INPUT) {
          currentTrade = bestTradeExactIn(allPairs, inputToken, specifiedAmount, outputToken, options)[0] ?? null;
        } else {
          currentTrade = null;
        }

        // if current trade is best yet, save it
        if (isTradeBetter(bestTradeSoFar, currentTrade)) {
          bestTradeSoFar = currentTrade;
        }
      } catch {}
    }

    return bestTradeSoFar;
  }, [allPairs, tradeType, inputToken, specifiedAmount, outputToken]);
};
