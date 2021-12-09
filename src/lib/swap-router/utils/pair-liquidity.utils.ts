import { TezosToolkit } from '@taquito/taquito';

import { DexTypeEnum } from '../dex-type.enum';
import { getLiquidityBakingPairLiquidity } from '../liquidity-baking/pair-liquidity.utils';
import { PairLiquidityInterface } from '../pair-liquidity.interface';
import { PairInterface } from '../pair.interface';
import { getPlentyPairLiquidity } from '../plenty/pair-liquidity.utils';
import { getQuipuSwapPairLiquidity } from '../quipu-swap/shared/pair-liquidity.utils';

const getPairLiquidityFn = (pair: PairInterface) => {
  switch (pair.dexType) {
    case DexTypeEnum.QuipuSwap:
      return getQuipuSwapPairLiquidity;
    case DexTypeEnum.Plenty:
      return getPlentyPairLiquidity;
    case DexTypeEnum.LiquidityBaking:
      return getLiquidityBakingPairLiquidity;
  }
};

export const getAllPairsLiquidity = async (pairs: PairInterface[]): Promise<PairLiquidityInterface[]> =>
  Promise.all(
    pairs.map(pair => {
      const getPairLiquidity = getPairLiquidityFn(pair);

      return getPairLiquidity(pair);
    })
  );
