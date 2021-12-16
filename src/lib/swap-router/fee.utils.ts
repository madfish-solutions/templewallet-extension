import { DexTypeEnum } from './dex-type.enum';
import { FeeInterface } from './fee.interface';
import { PairInterface } from './pair.interface';

const PAIR_FEE_RECORD: Record<DexTypeEnum, FeeInterface> = {
  [DexTypeEnum.QuipuSwap]: { numerator: 997, denominator: 1000 },
  [DexTypeEnum.Plenty]: { numerator: 9965, denominator: 10000 },
  [DexTypeEnum.LiquidityBaking]: { numerator: 9979, denominator: 10000 }
};

export const getPairFee = (pair: PairInterface) => PAIR_FEE_RECORD[pair.dexType];
