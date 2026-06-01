import { FC, Ref } from 'react';

import { isDefined } from '@rnw-community/shared';
import clsx from 'clsx';
import { isString } from 'lodash';

import { useCollectibleIsAdultSelector } from 'app/store/tezos/collectibles/selectors';
import { buildCollectibleImagesStack, buildEvmCollectibleIconSources, buildHttpLinkFromUri } from 'lib/images-uri';
import type { TokenMetadata } from 'lib/metadata';
import { EvmCollectibleMetadata } from 'lib/metadata/types';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { ImageStacked } from 'lib/ui/ImageStacked';
import { EMPTY_FROZEN_ARRAY } from 'lib/utils';

import { CollectibleBlur } from './collectible-blur';
import { CollectibleImageFallback } from './collectible-image-fallback';
import { CollectibleImageLoader } from './collectible-image-loader';

interface TezosCollectibleItemImageProps {
  assetSlug: string;
  metadata?: TokenMetadata;
  adultBlur: boolean;
  areDetailsLoading: boolean;
  mime?: string | null;
  extraSrc?: string;
  containerElemRef: Ref<Element>;
  className?: string;
  shouldUseBlurredBg?: boolean;
  manageActive?: boolean;
}

export const TezosCollectibleItemImage: FC<TezosCollectibleItemImageProps> = ({
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

  const sources = useMemoWithCompare(() => {
    if (!metadata) return EMPTY_FROZEN_ARRAY;

    const sources = buildCollectibleImagesStack(metadata);
    if (extraSrc !== undefined) {
      sources.push(extraSrc);
    }

    return sources;
  }, [metadata, extraSrc]);

  const isAudioCollectible = Boolean(mime?.startsWith('audio'));

  if (isAdultFlagLoading) {
    return <CollectibleImageLoader />;
  }

  return shouldShowBlur ? (
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
  );
};

interface EvmCollectibleItemImageProps {
  metadata?: EvmCollectibleMetadata;
  className?: string;
  shouldUseBlurredBg?: boolean;
}

export const EvmCollectibleItemImage: FC<EvmCollectibleItemImageProps> = ({
  metadata,
  className,
  shouldUseBlurredBg = false
}) => {
  const sources = useMemoWithCompare(() => [buildHttpLinkFromUri(metadata?.image)].filter(isString), [metadata]);
  const sourcesWithCompressedFallback = useMemoWithCompare(
    () => (metadata ? buildEvmCollectibleIconSources(metadata) : EMPTY_FROZEN_ARRAY),
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
};
