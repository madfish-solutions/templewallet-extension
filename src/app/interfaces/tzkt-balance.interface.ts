import { TokenStandard } from 'lib/temple/assets/types';

export interface TzktBalanceItemInterface {
  id: number;
  account: {
    address: string;
  };
  token: {
    id: number;
    contract: {
      alias: string;
      address: string;
    };
    tokenId: string;
    standard: TokenStandard;
    totalSupply: string;
    metadata: {
      decimals?: string;
      name: string;
      symbol?: string;
      thumbnailUri?: string;
    };
  };
  balance: string;
  transfersCount: number;
  firstLevel: number;
  firstTime: string;
  lastLevel: number;
  lastTime: string;
}
