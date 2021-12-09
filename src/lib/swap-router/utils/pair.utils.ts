import { TezosToolkit } from '@taquito/taquito';

import { getLiquidityBakingPairs } from '../liquidity-baking/pair.utils';
import { PairInterface } from '../pair.interface';
import { getPlentyPairs } from '../plenty/pair.utils';
import { getQuipuSwapPairs } from '../quipu-swap/pair.utils';

export const getAllPairs = async (tezos: TezosToolkit): Promise<PairInterface[]> =>
  Promise.all([getQuipuSwapPairs(tezos), getPlentyPairs(tezos), getLiquidityBakingPairs(tezos)]).then(
    ([quipuSwapPairs, plentyPairs, liquidityBakingPairs]) => [
      ...quipuSwapPairs,
      ...plentyPairs,
      ...liquidityBakingPairs
    ]
  );
