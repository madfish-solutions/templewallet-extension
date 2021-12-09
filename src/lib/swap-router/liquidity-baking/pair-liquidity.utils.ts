import { PairLiquidityInterface } from '../pair-liquidity.interface';
import { PairInterface } from '../pair.interface';
import { LiquidityBakingDexStorageInterface } from './dex-storage.interface';

export const getLiquidityBakingPairLiquidity = async (pair: PairInterface): Promise<PairLiquidityInterface> => {
  const storage = await pair.dexContract.storage<LiquidityBakingDexStorageInterface>();

  return {
    ...pair,
    aTokenPool: storage.xtzPool,
    bTokenPool: storage.tokenPool
  };
};
