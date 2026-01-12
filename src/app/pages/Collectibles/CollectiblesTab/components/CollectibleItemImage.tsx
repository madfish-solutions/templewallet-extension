import React, { memo, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import clsx from 'clsx';
import { isString } from 'lodash';

import { useCollectibleIsAdultSelector } from 'app/store/tezos/collectibles/selectors';
import { buildCollectibleImagesStack, buildEvmCollectibleIconSources, buildHttpLinkFromUri } from 'lib/images-uri';
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
  extraSrc?: string;
  containerElemRef: React.RefObject<Element | null>;
  className?: string;
  shouldUseBlurredBg?: boolean;
  manageActive?: boolean;
}

export const TezosCollectibleItemImage = memo<TezosCollectibleItemImageProps>(
  ({
    assetSlug,
    metadata,
    adultBlur,
    areDetailsLoading,
    mime,
    extraSrc,
    className,
    shouldUseBlurredBg = false,
    manageActive = false
  }) => {
    const isAdultContent = useCollectibleIsAdultSelector(assetSlug);
    const isAdultFlagLoading = areDetailsLoading && !isDefined(isAdultContent);
    const shouldShowBlur = isAdultContent && adultBlur;

    const sources = useMemo(() => {
      if (!isDefined(metadata)) return [];

      const baseSources = buildCollectibleImagesStack(metadata);
      if (extraSrc !== undefined) {
        baseSources.push(extraSrc);
      }

      return baseSources;
    }, [metadata, extraSrc]);

    const isAudioCollectible = useMemo(() => Boolean(mime && mime.startsWith('audio')), [mime]);

    return (
      <>
        {isAdultFlagLoading ? (
          <CollectibleImageLoader />
        ) : shouldShowBlur ? (
          <CollectibleBlur assetSlug={assetSlug} eyeIconSizeClassName={manageActive ? 'w-6 h-6' : undefined} />
        ) : (
          <>
            {shouldUseBlurredBg && (
              <ImageStacked sources={sources} loading="lazy" className="absolute w-full h-full object-cover blur-xs" />
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
    const sources = useMemo(() => [buildHttpLinkFromUri(metadata?.image)].filter(isString), [metadata?.image]);
    const sourcesWithCompressedFallback = useMemo(
      () => (metadata ? buildEvmCollectibleIconSources(metadata) : []),
      [metadata]
    );

    return (
      <>
        {shouldUseBlurredBg && (
          <ImageStacked
            sources={sourcesWithCompressedFallback}
            loading="lazy"
            className="absolute w-full h-full object-cover blur-xs"
          />
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
