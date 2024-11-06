import React, { memo, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import clsx from 'clsx';

import { useCollectibleIsAdultSelector } from 'app/store/tezos/collectibles/selectors';
import { buildCollectibleImagesStack, buildEvmCollectibleIconSources } from 'lib/images-uri';
import type { TokenMetadata } from 'lib/metadata';
import { EvmCollectibleMetadata } from 'lib/metadata/types';
import { ImageStacked } from 'lib/ui/ImageStacked';

import { CollectibleBlur } from '../../components/CollectibleBlur';
import { CollectibleImageFallback } from '../../components/CollectibleImageFallback';
import { CollectibleImageLoader } from '../../components/CollectibleImageLoader';

interface Props {
  assetSlug: string;
  metadata?: TokenMetadata;
  adultBlur: boolean;
  areDetailsLoading: boolean;
  mime?: string | null;
  containerElemRef: React.RefObject<Element>;
  className?: string;
}

export const CollectibleItemImage = memo<Props>(
  ({ assetSlug, metadata, adultBlur, areDetailsLoading, mime, className }) => {
    const isAdultContent = useCollectibleIsAdultSelector(assetSlug);
    const isAdultFlagLoading = areDetailsLoading && !isDefined(isAdultContent);
    const shouldShowBlur = isAdultContent && adultBlur;

    const sources = useMemo(() => (metadata ? buildCollectibleImagesStack(metadata) : []), [metadata]);

    const isAudioCollectible = useMemo(() => Boolean(mime && mime.startsWith('audio')), [mime]);

    return (
      <>
        {isAdultFlagLoading ? (
          <CollectibleImageLoader />
        ) : shouldShowBlur ? (
          <CollectibleBlur />
        ) : (
          <ImageStacked
            sources={sources}
            loading="lazy"
            className={clsx('w-full h-full', className)}
            loader={<CollectibleImageLoader />}
            fallback={<CollectibleImageFallback isAudioCollectible={isAudioCollectible} />}
          />
        )}
      </>
    );
  }
);

interface EvmCollectibleItemImageProps {
  metadata: EvmCollectibleMetadata;
  className?: string;
}

export const EvmCollectibleItemImage = memo<EvmCollectibleItemImageProps>(({ metadata, className }) => {
  const sources = useMemo(() => buildEvmCollectibleIconSources(metadata), [metadata]);

  return (
    <ImageStacked
      sources={sources}
      loading="lazy"
      className={clsx('w-full h-full', className)}
      loader={<CollectibleImageLoader />}
      fallback={<CollectibleImageFallback />}
    />
  );
});
