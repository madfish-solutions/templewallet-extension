import type { ImageSourceStage } from 'lib/ui/race-image-urls';

export interface CollectiblesCollection {
  chainId: string | number;
  title?: string;
  logoSources?: ImageSourceStage[];
  collectionSlug: string;
}
