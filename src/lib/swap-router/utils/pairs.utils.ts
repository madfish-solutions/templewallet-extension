import { TezosToolkit } from '@taquito/taquito';

import { getLiquidityBakingPairs } from '../liquidity-baking/pairs.utils';
import { PairInterface } from '../pair.interface';
import { getPlentyPairs } from '../plenty/pairs.utils';
import { getQuipuSwapPairs } from '../quipu-swap/pairs.utils';

export const getAllPairs = async (tezos: TezosToolkit): Promise<PairInterface[]> =>
  Promise.all([getQuipuSwapPairs(tezos), getPlentyPairs(tezos), getLiquidityBakingPairs(tezos)]).then(
    ([quipuSwapPairs, plentyPairs, liquidityBakingPairs]) => [
      ...quipuSwapPairs,
      ...plentyPairs,
      ...liquidityBakingPairs
    ]
  );
