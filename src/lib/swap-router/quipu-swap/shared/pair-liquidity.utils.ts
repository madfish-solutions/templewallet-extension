import { PairLiquidityInterface } from '../../pair-liquidity.interface';
import { PairInterface } from '../../pair.interface';
import { QuipuSwapDexStorageInterface } from './dex-storage.interface';

export const getQuipuSwapPairLiquidity = async (pair: PairInterface): Promise<PairLiquidityInterface> => {
  const storage = await pair.dexContract.storage<QuipuSwapDexStorageInterface>();

  return {
    ...pair,
    aTokenPool: storage.storage.tez_pool,
    bTokenPool: storage.storage.token_pool
  };
};
