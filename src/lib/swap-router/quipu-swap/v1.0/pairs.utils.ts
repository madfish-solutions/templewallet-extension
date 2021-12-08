import { TezosToolkit } from '@taquito/taquito';

import { PairInterface } from '../../pair.interface';
import { getQuipuSwapFactoryPairs } from '../shared/factory.utils';

const FA1_2_FACTORY_CONTRACT = 'KT1Lw8hCoaBrHeTeMXbqHPG4sS4K1xn7yKcD';
const FA2_FACTORY_CONTRACT = 'KT1SwH9P1Tx8a58Mm6qBExQFTcy2rwZyZiXS';

export const getQuipuSwapV10Pairs = (tezos: TezosToolkit): Promise<PairInterface[]> =>
  Promise.all([
    getQuipuSwapFactoryPairs(FA1_2_FACTORY_CONTRACT, tezos),
    getQuipuSwapFactoryPairs(FA2_FACTORY_CONTRACT, tezos)
  ]).then(([fa1_2_factoryPairs, fa2_factoryPairs]) => [...fa1_2_factoryPairs, ...fa2_factoryPairs]);
