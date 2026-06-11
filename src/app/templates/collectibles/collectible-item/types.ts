import { Ref } from 'react';

import { CollectibleMetadata } from 'lib/metadata/types';
import { CollectiblesListItemElement } from 'lib/ui/collectibles-list';
import { ChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

export interface CommonLayoutProps<T extends TempleChainKind> {
  wrapperElemRef?: Ref<HTMLDivElement>;
  assetSlug: string;
  assetName: string;
  chainId: ChainId<T>;
  metadata?: CollectibleMetadata<T>;
  ref?: Ref<CollectiblesListItemElement>;
  scam?: boolean;
  index?: number;
  isVisible?: boolean;
  testID?: string;
  nameTestID?: string;
}
