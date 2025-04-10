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

interface TezosCollectibleItemImageProps {
  assetSlug: string;
  metadata?: TokenMetadata;
  adultBlur: boolean;
  areDetailsLoading: boolean;
  mime?: string | null;
  containerElemRef: React.RefObject<Element>;
  className?: string;
  shouldUseBlurredBg?: boolean;
}

export const TezosCollectibleItemImage = memo<TezosCollectibleItemImageProps>(
  ({ assetSlug, metadata, adultBlur, areDetailsLoading, mime, className, shouldUseBlurredBg = false }) => {
    const isAdultContent = useCollectibleIsAdultSelector(assetSlug);
    const isAdultFlagLoading = areDetailsLoading && !isDefined(isAdultContent);
    const shouldShowBlur = isAdultContent && adultBlur;

    const sources = useMemo(() => (isDefined(metadata) ? buildCollectibleImagesStack(metadata) : []), [metadata]);

    const isAudioCollectible = useMemo(() => Boolean(mime && mime.startsWith('audio')), [mime]);

    return (
      <>
        {isAdultFlagLoading ? (
          <CollectibleImageLoader />
        ) : shouldShowBlur ? (
          <CollectibleBlur assetSlug={assetSlug} />
        ) : (
          <>
            {shouldUseBlurredBg && (
              <ImageStacked sources={sources} loading="lazy" className="absolute w-full h-full object-cover blur-sm" />
            )}
            <ImageStacked
              sources={sources}
              loading="lazy"
              loader={<CollectibleImageLoader />}
              fallback={<CollectibleImageFallback isAudioCollectible={isAudioCollectible} />}
              className={clsx('w-full h-full z-1', className)}
            />
          </>
        )}
      </>
    );
  }
);

interface EvmCollectibleItemImageProps {
  metadata?: EvmCollectibleMetadata;
  className?: string;
  shouldUseBlurredBg?: boolean;
}

export const EvmCollectibleItemImage = memo<EvmCollectibleItemImageProps>(
  ({ metadata, className, shouldUseBlurredBg = false }) => {
    const sources = useMemo(() => (isDefined(metadata) ? buildEvmCollectibleIconSources(metadata) : []), [metadata]);

    return (
      <>
        {shouldUseBlurredBg && (
          <ImageStacked sources={sources} loading="lazy" className="absolute w-full h-full object-cover blur-sm" />
        )}
        <ImageStacked
          sources={sources}
          loading="lazy"
          loader={<CollectibleImageLoader />}
          fallback={<CollectibleImageFallback />}
          className={clsx('w-full h-full z-1', className)}
        />
      </>
    );
  }
);
