import { BigNumber } from 'bignumber.js';

import { TradeTypeEnum } from '../enum/trade-type.enum';
import { PairLiquidityInterface } from '../pair-liquidity.interface';
import { TokenInterface } from '../token.interface';

export interface TradeInterface {
  type: TradeTypeEnum;
  route: PairLiquidityInterface[];
  inputToken: TokenInterface;
  inputAmount: BigNumber;
  outputToken: TokenInterface;
  outputAmount: BigNumber;
}
