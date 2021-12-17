import { TezosToolkit } from '@taquito/taquito';

import { DexPairInterface } from '../../../interfaces/dex-pair.interface';
import { getQuipuSwapDexPairs } from '../shared/dex-pair.utils';

const FA1_2_FACTORY_CONTRACT = 'KT1Lw8hCoaBrHeTeMXbqHPG4sS4K1xn7yKcD';
const FA2_FACTORY_CONTRACT = 'KT1SwH9P1Tx8a58Mm6qBExQFTcy2rwZyZiXS';

export const getQuipuSwapV10DexPairs = (tezos: TezosToolkit): Promise<DexPairInterface[]> =>
  Promise.all([
    getQuipuSwapDexPairs(FA1_2_FACTORY_CONTRACT, tezos),
    getQuipuSwapDexPairs(FA2_FACTORY_CONTRACT, tezos)
  ]).then(([fa1_2_factoryPairs, fa2_factoryPairs]) => [...fa1_2_factoryPairs, ...fa2_factoryPairs]);
