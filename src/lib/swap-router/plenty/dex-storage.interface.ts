import { BigNumber } from 'bignumber.js';

export interface PlentyDexStorageInterface {
  token1Address: string;
  token1Check: boolean;
  token1Id: BigNumber;
  token1_pool: BigNumber;

  token2Address: string;
  token2Check: boolean;
  token2Id: BigNumber;
  token2_pool: BigNumber;
}
