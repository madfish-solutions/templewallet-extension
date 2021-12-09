import { BigNumber } from 'bignumber.js';

import { PairInterface } from './pair.interface';

export interface PairLiquidityInterface extends PairInterface {
  aTokenPool: BigNumber;
  bTokenPool: BigNumber;
}
