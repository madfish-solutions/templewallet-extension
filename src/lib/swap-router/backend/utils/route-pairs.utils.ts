import { TezosToolkit } from '@taquito/taquito';

import { DexTypeEnum } from '../../dex-type.enum';
import { getLiquidityBakingRoutePair } from '../dexes/liquidity-baking/route-pair.utils';
import { getPlentyRoutePair } from '../dexes/plenty/route-pair.utils';
import { getQuipuSwapRoutePair } from '../dexes/quipu-swap/shared/route-pair.utils';
import { DexPairInterface } from '../interfaces/dex-pair.interface';
import { RoutePair } from '../interfaces/route-pair.interface';
import { getAllDexPairs } from './dex-pairs.utils';

const rpcUrl = 'https://mainnet-node.madfish.solutions';
const Tezos = new TezosToolkit(rpcUrl);

const ROUTE_PAIR_FUNCTION_RECORD: Record<DexTypeEnum, (pair: DexPairInterface) => Promise<RoutePair>> = {
  [DexTypeEnum.QuipuSwap]: getQuipuSwapRoutePair,
  [DexTypeEnum.Plenty]: getPlentyRoutePair,
  [DexTypeEnum.LiquidityBaking]: getLiquidityBakingRoutePair
};

export const getAllRoutePairs = async () => {
  const dexPairs = await getAllDexPairs(Tezos);

  return Promise.all(
    dexPairs.map(dexPair => {
      const getPairLiquidity = ROUTE_PAIR_FUNCTION_RECORD[dexPair.dexType];

      return getPairLiquidity(dexPair);
    })
  );
};
