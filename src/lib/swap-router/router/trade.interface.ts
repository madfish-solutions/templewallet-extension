import { BigNumber } from 'bignumber.js';

import { PairLiquidityInterface } from '../pair-liquidity.interface';
import { TokenInterface } from '../token.interface';
import { TradeTypeEnum } from './trade-type.enum';

export interface TradeInterface {
  type: TradeTypeEnum;
  route: PairLiquidityInterface[];
  inputToken: TokenInterface;
  inputAmount: BigNumber;
  outputToken: TokenInterface;
  outputAmount: BigNumber;
}
