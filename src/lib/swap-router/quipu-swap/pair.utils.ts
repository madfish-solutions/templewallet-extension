import { TezosToolkit } from '@taquito/taquito';

import { PairInterface } from '../pair.interface';
import { getQuipuSwapV10Pairs } from './v1.0/pair.utils';
import { getQuipuSwapV12Pairs } from './v1.2/pair.utils';

export const getQuipuSwapPairs = (tezos: TezosToolkit): Promise<PairInterface[]> =>
  Promise.all([getQuipuSwapV10Pairs(tezos), getQuipuSwapV12Pairs(tezos)]).then(([v1_0_Pairs, v1_2_Pairs]) => [
    // ...v1_0_Pairs,
    ...v1_2_Pairs
  ]);
