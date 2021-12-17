import { TezosToolkit } from '@taquito/taquito';

import { getLiquidityBakingDexPairs } from '../dexes/liquidity-baking/dex-pair.utils';
import { getPlentyDexPairs } from '../dexes/plenty/dex-pair.utils';
import { getQuipuSwapDexPairs } from '../dexes/quipu-swap/dex-pair.utils';
import { DexPairInterface } from '../interfaces/dex-pair.interface';

export const getAllDexPairs = async (tezos: TezosToolkit): Promise<DexPairInterface[]> =>
  Promise.all([getQuipuSwapDexPairs(tezos), getPlentyDexPairs(tezos), getLiquidityBakingDexPairs(tezos)]).then(
    ([quipuSwapPairs, plentyPairs, liquidityBakingPairs]) => [
      ...quipuSwapPairs,
      ...plentyPairs,
      ...liquidityBakingPairs
    ]
  );
