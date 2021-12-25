import { DexPairInterface } from '../../interfaces/dex-pair.interface';
import { RoutePair } from '../../interfaces/route-pair.interface';
import { PlentyDexStorageInterface } from './dex-storage.interface';

export const getPlentyRoutePair = async ({
  dexType,
  dexContract,
  aTokenSlug,
  bTokenSlug
}: DexPairInterface): Promise<RoutePair> => {
  const storage = await dexContract.storage<PlentyDexStorageInterface>();

  return {
    dexType,
    aTokenSlug,
    bTokenSlug,
    dexAddress: dexContract.address,
    aTokenPool: storage.token1_pool,
    bTokenPool: storage.token2_pool
  };
};
