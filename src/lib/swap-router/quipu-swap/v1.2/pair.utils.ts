import { TezosToolkit } from '@taquito/taquito';

import { PairInterface } from '../../pair.interface';
import { getQuipuSwapFactoryPairs } from '../shared/factory.utils';

const FA1_2_FACTORY_CONTRACT = 'KT1FWHLMk5tHbwuSsp31S4Jum4dTVmkXpfJw';
const FA2_FACTORY_CONTRACT = 'KT1PvEyN1xCFCgorN92QCfYjw3axS6jawCiJ';

export const getQuipuSwapV12Pairs = (tezos: TezosToolkit): Promise<PairInterface[]> =>
  Promise.all([
    getQuipuSwapFactoryPairs(FA1_2_FACTORY_CONTRACT, tezos),
    getQuipuSwapFactoryPairs(FA2_FACTORY_CONTRACT, tezos)
  ]).then(([fa1_2_factoryPairs, fa2_factoryPairs]) => [...fa1_2_factoryPairs, ...fa2_factoryPairs]);
