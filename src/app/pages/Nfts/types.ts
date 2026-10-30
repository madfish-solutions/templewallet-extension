import type { ImageSourceStage } from 'lib/ui/race-image-urls';

export interface CollectiblesCollection {
  chainId: string | number;
  title?: string;
  logoSources?: ImageSourceStage[];
  collectionSlug: string;
  /** Chain and contract, shared by every collection minted on that contract. */
  contractSlug: string;
}
