import type { ImageSourceStage } from 'lib/ui/race-image-urls';

export interface CollectiblesCollection {
  chainId: string | number;
  title?: string;
  logoSources?: ImageSourceStage[];
  collectionSlug: string;
  /** Chain and contract, shared by every collection minted on that contract. */
  contractSlug: string;
  /** Distinct NFTs the account owns. Present for an Alchemy inventory card. */
  ownedCount?: number;
  /** Contracts to ask Alchemy for when the card is opened. */
  contractAddresses?: readonly string[];
}
