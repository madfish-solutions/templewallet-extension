import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import clsx from 'clsx';
import { isString } from 'lodash';

import { Model3DViewer } from 'app/atoms/Model3DViewer';
import { useCollectiblesListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { TezosAssetImageStacked } from 'app/templates/AssetImage';
import {
  isSvgDataUriInUtf8Encoding,
  buildObjktCollectibleArtifactUri,
  buildHttpLinkFromUri,
  buildEvmCollectibleIconSources
} from 'lib/images-uri';
import { TokenMetadata } from 'lib/metadata';
import { EvmCollectibleMetadata } from 'lib/metadata/types';
import { ImageStacked } from 'lib/ui/ImageStacked';

import { AudioCollectible } from '../../components/AudioCollectible';
import { CollectibleBlur } from '../../components/CollectibleBlur';
import { CollectibleImageFallback } from '../../components/CollectibleImageFallback';
import { CollectibleImageLoader } from '../../components/CollectibleImageLoader';
import { VideoCollectible } from '../../components/VideoCollectible';

interface TezosCollectiblePageImageProps {
  metadata: TokenMetadata;
  areDetailsLoading: boolean;
  mime?: string | null;
  objktArtifactUri?: string;
  isAdultContent?: boolean;
  className?: string;
}

export const TezosCollectiblePageImage = memo<TezosCollectiblePageImageProps>(
  ({ metadata, mime, objktArtifactUri, className, areDetailsLoading, isAdultContent = false }) => {
    const { blur } = useCollectiblesListOptionsSelector();

    const blurred = isAdultContent && blur;

    const [isRenderFailedOnce, setIsRenderFailedOnce] = useState(false);

    const [shouldShowBlur, setShouldShowBlur] = useState(blurred);
    useEffect(() => setShouldShowBlur(blurred), [blurred]);

    const handleBlurClick = useCallback(() => setShouldShowBlur(false), []);

    const handleError = useCallback(() => setIsRenderFailedOnce(true), []);

    if (areDetailsLoading) {
      return <CollectibleImageLoader large />;
    }

    if (shouldShowBlur) {
      return <CollectibleBlur metadata={metadata} large onClick={handleBlurClick} />;
    }

    if (objktArtifactUri && !isRenderFailedOnce) {
      if (isSvgDataUriInUtf8Encoding(objktArtifactUri)) {
        return <img src={objktArtifactUri} alt={metadata?.name} className={className} onError={handleError} />;
      }

      if (mime) {
        if (mime.startsWith('model')) {
          return (
            <Model3DViewer
              uri={buildObjktCollectibleArtifactUri(objktArtifactUri)}
              alt={metadata?.name}
              onError={handleError}
            />
          );
        }

        if (mime.startsWith('video')) {
          return (
            <VideoCollectible
              uri={buildObjktCollectibleArtifactUri(objktArtifactUri)}
              className={className}
              onError={handleError}
            />
          );
        }

        if (mime.startsWith('audio')) {
          return (
            <AudioCollectible
              uri={buildObjktCollectibleArtifactUri(objktArtifactUri)}
              metadata={metadata}
              className={className}
              onAudioError={handleError}
            />
          );
        }
      }
    }

    return (
      <>
        <TezosAssetImageStacked
          metadata={metadata}
          fullViewCollectible
          className="absolute w-full h-full object-cover blur"
        />
        <TezosAssetImageStacked
          metadata={metadata}
          fullViewCollectible
          loader={<CollectibleImageLoader large />}
          fallback={<CollectibleImageFallback large />}
          className={clsx('w-full h-full object-contain z-1', className)}
        />
      </>
    );
  }
);

interface EvmCollectiblePageImageProps {
  metadata: EvmCollectibleMetadata;
  className?: string;
}

export const EvmCollectiblePageImage = memo<EvmCollectiblePageImageProps>(({ metadata, className }) => {
  const { image } = metadata;

  const sources = useMemo(() => [buildHttpLinkFromUri(image)].filter(isString), [image]);
  const sourcesWithCompressedFallback = useMemo(() => buildEvmCollectibleIconSources(metadata), [metadata]);

  return (
    <>
      <ImageStacked sources={sourcesWithCompressedFallback} className="absolute w-full h-full object-cover blur" />
      <ImageStacked
        sources={sources}
        loader={<CollectibleImageLoader large />}
        fallback={<CollectibleImageFallback large />}
        className={clsx('w-full h-full object-contain z-1', className)}
      />
    </>
  );
});
