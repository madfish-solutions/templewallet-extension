import BigNumber from 'bignumber.js';

import { ChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

export interface EarnOffer {
  id: string;
  link: string;
  symbol: string;
  name: string;
  chainKind: TempleChainKind;
  chainId: ChainId<TempleChainKind>;
  assetSlug: string;
  displayYield?: string;
  providerIcon?: ImportedSVGComponent;
  isExternal?: boolean;
}

export interface ActiveDeposit {
  amount?: BigNumber;
  isLoading: boolean;
}
