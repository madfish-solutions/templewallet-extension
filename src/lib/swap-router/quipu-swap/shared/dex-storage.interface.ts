import { BigNumber } from 'bignumber.js';

export interface QuipuSwapDexStorageInterface {
  storage: {
    tez_pool: BigNumber;
    token_pool: BigNumber;
  };
}
