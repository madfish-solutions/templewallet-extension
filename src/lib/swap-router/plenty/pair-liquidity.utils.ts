import { PairLiquidityInterface } from '../pair-liquidity.interface';
import { PairInterface } from '../pair.interface';
import { PlentyDexStorageInterface } from './dex-storage.interface';

export const getPlentyPairLiquidity = async (pair: PairInterface): Promise<PairLiquidityInterface> => {
  const storage = await pair.dexContract.storage<PlentyDexStorageInterface>();

  return {
    ...pair,
    aTokenPool: storage.token1_pool,
    bTokenPool: storage.token2_pool
  };
};
