import { TezosToolkit } from '@taquito/taquito';

import { DexPairInterface } from '../../../interfaces/dex-pair.interface';
import { getQuipuSwapDexPairs } from '../shared/dex-pair.utils';

const FA1_2_FACTORY_CONTRACT = 'KT1FWHLMk5tHbwuSsp31S4Jum4dTVmkXpfJw';
const FA2_FACTORY_CONTRACT = 'KT1PvEyN1xCFCgorN92QCfYjw3axS6jawCiJ';

export const getQuipuSwapV12DexPairs = (tezos: TezosToolkit): Promise<DexPairInterface[]> =>
  Promise.all([
    getQuipuSwapDexPairs(FA1_2_FACTORY_CONTRACT, tezos),
    getQuipuSwapDexPairs(FA2_FACTORY_CONTRACT, tezos)
  ]).then(([fa1_2_factoryPairs, fa2_factoryPairs]) => [...fa1_2_factoryPairs, ...fa2_factoryPairs]);
