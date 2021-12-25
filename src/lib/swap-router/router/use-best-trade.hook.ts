import { useEffect, useMemo, useState } from 'react';

import { TezosToolkit } from '@taquito/taquito';
import { BigNumber } from 'bignumber.js';

import { RoutePair } from '../backend/interfaces/route-pair.interface';
import { TradeTypeEnum } from '../enum/trade-type.enum';
import { TokenInterface } from '../token.interface';
import { bestTradeExactIn } from './best-trade.utils';
import { isTradeBetter } from './trade.utils';

const MAX_HOPS = 3;

export const useBestTrade = (
  tradeType: TradeTypeEnum,
  inputToken: TokenInterface,
  outputToken: TokenInterface,
  specifiedAmount: BigNumber,
  tezos: TezosToolkit
) => {
  const [allPairs, setAllPairs] = useState<RoutePair[]>([]);

  useEffect(() => {
    (async () => {
      const allPairs: RoutePair[] = [];//await getRoutePairs();

      setAllPairs(allPairs);
    })();
  }, [tezos]);

  return useMemo(() => {
    let bestTradeSoFar = null;

    for (let i = 1; i <= MAX_HOPS; i++) {
      try {
        const options = { maxHops: i, maxNumResults: 1 };

        let currentTrade = null;
        if (tradeType === TradeTypeEnum.EXACT_INPUT) {
          // @ts-ignore
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
