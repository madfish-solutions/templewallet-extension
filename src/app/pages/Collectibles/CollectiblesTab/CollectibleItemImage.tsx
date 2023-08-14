import React, { FC, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useCollectibleIsAdultSelector } from 'app/store/collectibles/selectors';
import { AssetImage } from 'app/templates/AssetImage';
import type { TokenMetadata } from 'lib/metadata';

import { CollectibleBlur } from '../components/CollectibleBlur';
import { CollectibleImageFallback } from '../components/CollectibleImageFallback';
import { CollectibleImageLoader } from '../components/CollectibleImageLoader';

interface Props {
  assetSlug: string;
  metadata?: TokenMetadata;
  areDetailsLoading: boolean;
  mime?: string | null;
}

export const CollectibleItemImage: FC<Props> = ({ assetSlug, metadata, areDetailsLoading, mime }) => {
  const isAdultContent = useCollectibleIsAdultSelector(assetSlug);

  const isAudioCollectible = useMemo(() => Boolean(mime && mime.startsWith('audio')), [mime]);

  if (areDetailsLoading && !isDefined(isAdultContent)) {
    return <CollectibleImageLoader />;
  }

  if (isAdultContent) {
    return <CollectibleBlur />;
  }

  return (
    <AssetImage
      metadata={metadata}
      loader={<CollectibleImageLoader />}
      fallback={<CollectibleImageFallback isAudioCollectible={isAudioCollectible} />}
    />
  );
};
