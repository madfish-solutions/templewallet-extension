import { DexPairInterface } from '../../../interfaces/dex-pair.interface';
import { RoutePairInterface } from '../../../interfaces/route-pair.interface';
import { QuipuSwapDexStorageInterface } from './dex-storage.interface';

export const getQuipuSwapRoutePair = async ({
  dexType,
  dexContract,
  aTokenSlug,
  bTokenSlug
}: DexPairInterface): Promise<RoutePairInterface> => {
  const storage = await dexContract.storage<QuipuSwapDexStorageInterface>();

  return {
    dexType,
    aTokenSlug,
    bTokenSlug,
    dexAddress: dexContract.address,
    aTokenPool: storage.storage.tez_pool,
    bTokenPool: storage.storage.token_pool
  };
};
