import { BigNumber } from 'bignumber.js';

import { DexTypeEnum } from '../dex-type.enum';
import { RoutePairWithDirection } from '../interface/route-pair-with-direction.interface';
import { Trade, TradeOperation } from '../interface/trade.interface';

const PAIR_FEE_PERCENT_RECORD: Record<DexTypeEnum, number> = {
  [DexTypeEnum.QuipuSwap]: 0.3,
  [DexTypeEnum.Plenty]: 0.35,
  [DexTypeEnum.LiquidityBaking]: 0.21
};

export const getPairFeeRatio = (pair: RoutePairWithDirection) => {
  const feePercent = PAIR_FEE_PERCENT_RECORD[pair.dexType];

  return new BigNumber(100).minus(feePercent).dividedBy(100);
};

const getTradeOperationFakeFee = (tradeOperation: TradeOperation) => {
  // TODO: add estimated fee base on aToken token type
  return 1;
};

export const getTradeFakeFee = (trade: Trade) => {
  let fakeFeeSum = new BigNumber(0);

  for (let tradeOperation of trade) {
    const tradeOperationFakeFee = getTradeOperationFakeFee(tradeOperation);

    fakeFeeSum = fakeFeeSum.plus(tradeOperationFakeFee);
  }

  return fakeFeeSum;
};
