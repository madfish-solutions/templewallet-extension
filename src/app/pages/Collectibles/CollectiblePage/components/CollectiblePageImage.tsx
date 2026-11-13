import React, { FC, memo, ReactNode, useCallback, useMemo, useState } from 'react';

import clsx from 'clsx';

import { reportDeadEvmCollectiblePreview } from 'app/hooks/evm-collectible-dead-preview';
import { useCollectiblesListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { TezosAssetImageStacked } from 'app/templates/AssetImage';
import { CollectibleBlur } from 'app/templates/collectibles/collectible-blur';
import { CollectibleImageFallback } from 'app/templates/collectibles/collectible-image-fallback';
import { CollectibleImageLoader } from 'app/templates/collectibles/collectible-image-loader';
import {
  isSvgDataUriInUtf8Encoding,
  buildObjktArtifactExtraSrc,
  buildObjktCollectibleArtifactUris,
  buildEvmCollectibleIconSources,
  buildEvmCollectiblePreviewSources,
  buildHttpLinkFromUri
} from 'lib/images-uri';
import { TokenMetadata } from 'lib/metadata';
import { collectibleMediaKindFromMime, collectiblePageMediaKind } from 'lib/metadata/collectible-media';
import { EvmCollectibleMetadata } from 'lib/metadata/types';
import { getCollectibleName } from 'lib/metadata/utils';
import { useBooleanState } from 'lib/ui/hooks';
import { ImageStacked } from 'lib/ui/ImageStacked';

import { CollectiblePageMedia } from './collectible-page-media';

interface TezosCollectiblePageImageProps {
  assetSlug: string;
  metadata?: TokenMetadata;
  areDetailsLoading: boolean;
  mime?: string | null;
  objktArtifactUri?: string;
  isAdultContent?: boolean;
  className?: string;
}

const SvgCollectibleAttempt: FC<{ uri: string; alt?: string; className?: string; fallback: ReactNode }> = ({
  uri,
  alt,
  className,
  fallback
}) => {
  const [failed, setFailed] = useState(false);
  if (failed) return fallback;

  return <img src={uri} alt={alt} className={className} onError={() => setFailed(true)} />;
};

export const TezosCollectiblePageImage = memo<TezosCollectiblePageImageProps>(
  ({ assetSlug, metadata, mime, objktArtifactUri, className, areDetailsLoading, isAdultContent = false }) => {
    const { blur } = useCollectiblesListOptionsSelector();

    const blurred = isAdultContent && blur;

    const [failedArtifactUris, setFailedArtifactUris] = useState<string[]>([]);

    const [shouldShowBlur, setShouldShowBlur] = useState(blurred);
    const [trackedBlur, setTrackedBlur] = useState(blurred);
    if (blurred !== trackedBlur) {
      setTrackedBlur(blurred);
      setShouldShowBlur(blurred);
    }

    const handleBlurClick = useCallback(() => setShouldShowBlur(false), []);

    const artifactUri = objktArtifactUri
      ? buildObjktCollectibleArtifactUris(objktArtifactUri).find(uri => !failedArtifactUris.includes(uri))
      : undefined;
    const kind = collectibleMediaKindFromMime(mime);

    const handleError = () => {
      if (artifactUri) setFailedArtifactUris(prev => prev.concat(artifactUri));
    };

    if (areDetailsLoading) {
      return <CollectibleImageLoader large />;
    }

    if (shouldShowBlur) {
      return <CollectibleBlur assetSlug={assetSlug} large onClick={handleBlurClick} />;
    }

    const background = (
      <TezosAssetImageStacked
        metadata={metadata}
        fullViewCollectible
        className="absolute w-full h-full object-cover blur"
      />
    );
    const foreground = (
      <TezosAssetImageStacked
        metadata={metadata}
        extraSrc={artifactUri && buildObjktArtifactExtraSrc(artifactUri)}
        fullViewCollectible
        loader={<CollectibleImageLoader large />}
        fallback={<CollectibleImageFallback large />}
        className={clsx('w-full h-full object-contain z-1', className)}
      />
    );
    const audioPoster = (
      <TezosAssetImageStacked
        metadata={metadata}
        fullViewCollectible
        fallback={<CollectibleImageFallback large isAudioCollectible />}
        className={className}
      />
    );

    if (artifactUri && isSvgDataUriInUtf8Encoding(artifactUri)) {
      return (
        <SvgCollectibleAttempt
          key={artifactUri}
          uri={artifactUri}
          alt={metadata?.name}
          className={className}
          fallback={
            <>
              {background}
              {foreground}
            </>
          }
        />
      );
    }

    return (
      <CollectiblePageMedia
        kind={kind}
        uri={kind ? artifactUri : undefined}
        alt={metadata?.name}
        className={className}
        background={background}
        foreground={foreground}
        audioPoster={audioPoster}
        onError={handleError}
      />
    );
  }
);

interface EvmCollectiblePageImageProps {
  chainId: number;
  assetSlug: string;
  metadata: EvmCollectibleMetadata;
  className?: string;
}

export const EvmCollectiblePageImage = memo<EvmCollectiblePageImageProps>(
  ({ chainId, assetSlug, metadata, className }) => {
    const sources = useMemo(() => buildEvmCollectiblePreviewSources(metadata), [metadata]);
    const sourcesWithCompressedFallback = useMemo(
      () => buildEvmCollectibleIconSources(metadata, { includeCompressed: false }),
      [metadata]
    );
    const [previewFailed, setPreviewFailedState] = useBooleanState(false);
    const handlePreviewFailed = () => {
      reportDeadEvmCollectiblePreview(chainId, assetSlug, metadata);
      setPreviewFailedState();
    };
    const kind = collectiblePageMediaKind(metadata.artifactUrl);
    const audioPoster = sources.length ? (
      <ImageStacked
        sources={sources}
        immediate
        loader={<CollectibleImageLoader large />}
        fallback={<CollectibleImageFallback large isAudioCollectible />}
        className={clsx('z-1 h-full w-full object-contain', className)}
      />
    ) : undefined;

    return (
      <CollectiblePageMedia
        failed={previewFailed}
        kind={kind}
        uri={kind ? buildHttpLinkFromUri(metadata.artifactUrl) : undefined}
        alt={getCollectibleName(metadata)}
        className={className}
        background={
          <ImageStacked
            sources={sourcesWithCompressedFallback}
            immediate
            className="absolute h-full w-full object-cover blur"
          />
        }
        foreground={
          <ImageStacked
            sources={sources}
            immediate
            loader={<CollectibleImageLoader large />}
            fallback={<CollectibleImageFallback large />}
            className={clsx('z-1 h-full w-full object-contain', className)}
            onStackFailed={handlePreviewFailed}
          />
        }
        audioPoster={audioPoster}
        onError={handlePreviewFailed}
      />
    );
  }
);
