import { BigNumber } from 'bignumber.js';

import { RoutePairWithDirection } from './route-pair-with-direction.interface';

export interface TradeOperation extends RoutePairWithDirection {
  aTokenAmount: BigNumber;
  bTokenAmount: BigNumber;
}

export type Trade = TradeOperation[];
