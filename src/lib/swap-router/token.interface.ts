import { BigNumber } from 'bignumber.js';

export interface TokenInterface {
  address: 'tez' | string;
  id?: BigNumber;
}
