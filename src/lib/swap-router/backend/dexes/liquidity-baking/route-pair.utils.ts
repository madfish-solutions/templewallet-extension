import { DexPairInterface } from '../../interfaces/dex-pair.interface';
import { RoutePairInterface } from '../../interfaces/route-pair.interface';
import { LiquidityBakingDexStorageInterface } from './dex-storage.interface';

export const getLiquidityBakingRoutePair = async ({
  dexType,
  dexContract,
  aTokenSlug,
  bTokenSlug
}: DexPairInterface): Promise<RoutePairInterface> => {
  const storage = await dexContract.storage<LiquidityBakingDexStorageInterface>();

  return {
    dexType,
    aTokenSlug,
    bTokenSlug,
    dexAddress: dexContract.address,
    aTokenPool: storage.xtzPool,
    bTokenPool: storage.tokenPool
  };
};
