import { BigNumber } from 'bignumber.js';

export interface LiquidityBakingDexStorageInterface {
  tokenAddress: string;
  tokenPool: BigNumber;
  xtzPool: BigNumber;
}
