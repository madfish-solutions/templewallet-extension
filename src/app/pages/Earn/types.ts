import { ChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

export interface EarnOffer {
  id: string;
  link: string;
  name: string;
  description: string;
  type: 'saving' | 'external';
  chainKind: TempleChainKind;
  chainId: ChainId<TempleChainKind>;
  assetSlug: string;
  displayYield?: string;
  providerIcon?: ImportedSVGComponent;
  isExternal?: boolean;
}
