import React, { FC, useMemo } from 'react';

import { AssetImage } from 'app/templates/AssetImage';
import { AssetMetadataBase } from 'lib/metadata';

import { CollectibleBlur } from '../components/CollectibleBlur';
import { CollectibleImageFallback } from '../components/CollectibleImageFallback';
import { CollectibleImageLoader } from '../components/CollectibleImageLoader';

interface Props {
  assetSlug: string;
  metadata?: AssetMetadataBase;
  areDetailsLoading: boolean;
  mime?: string | null;
  isAdultContent?: boolean;
}

export const CollectibleItemImage: FC<Props> = ({ assetSlug, metadata, areDetailsLoading, mime, isAdultContent }) => {
  const isAudioCollectible = useMemo(() => Boolean(mime && mime.startsWith('audio')), [mime]);

  if (areDetailsLoading) {
    return <CollectibleImageLoader />;
  }

  if (isAdultContent) {
    return <CollectibleBlur />;
  }

  return (
    <AssetImage
      metadata={metadata}
      assetSlug={assetSlug}
      loader={<CollectibleImageLoader />}
      fallback={<CollectibleImageFallback isAudioCollectible={isAudioCollectible} />}
    />
  );
};
