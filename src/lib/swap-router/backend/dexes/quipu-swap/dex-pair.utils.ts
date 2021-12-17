import { TezosToolkit } from '@taquito/taquito';

import { DexPairInterface } from '../../interfaces/dex-pair.interface';
import { getQuipuSwapV10DexPairs } from './v1.0/dex-pair.utils';
import { getQuipuSwapV12DexPairs } from './v1.2/dex-pair.utils';

export const getQuipuSwapDexPairs = (tezos: TezosToolkit): Promise<DexPairInterface[]> =>
  Promise.all([getQuipuSwapV10DexPairs(tezos), getQuipuSwapV12DexPairs(tezos)]).then(([v1_0_Pairs, v1_2_Pairs]) => [
    ...v1_0_Pairs,
    ...v1_2_Pairs
  ]);
