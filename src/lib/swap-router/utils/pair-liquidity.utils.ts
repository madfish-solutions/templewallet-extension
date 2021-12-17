import { DexTypeEnum } from '../dex-type.enum';
import { getLiquidityBakingPairLiquidity } from '../liquidity-baking/pair-liquidity.utils';
import { PairLiquidityInterface } from '../pair-liquidity.interface';
import { PairInterface } from '../pair.interface';
import { getPlentyPairLiquidity } from '../plenty/pair-liquidity.utils';
import { getQuipuSwapPairLiquidity } from '../quipu-swap/shared/pair-liquidity.utils';
import { ZERO } from '../router/best-trade.utils';

const PAIR_LIQUIDITY_FUNCTION_RECORD: Record<DexTypeEnum, (pair: PairInterface) => Promise<PairLiquidityInterface>> = {
  [DexTypeEnum.QuipuSwap]: getQuipuSwapPairLiquidity,
  [DexTypeEnum.Plenty]: getPlentyPairLiquidity,
  [DexTypeEnum.LiquidityBaking]: getLiquidityBakingPairLiquidity
};

export const getAllPairsLiquidity = async (pairs: PairInterface[]): Promise<PairLiquidityInterface[]> =>
  Promise.all(
    pairs.map(pair => {
      const getPairLiquidity = PAIR_LIQUIDITY_FUNCTION_RECORD[pair.dexType];

      return getPairLiquidity(pair);
    })
  ).then(pairs => pairs.filter(pair => !pair.aTokenPool.isEqualTo(ZERO) && !pair.bTokenPool.isEqualTo(ZERO)));
