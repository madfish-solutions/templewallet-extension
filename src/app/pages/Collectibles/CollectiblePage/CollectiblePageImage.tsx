import React, { memo, useCallback, useEffect, useState } from 'react';

import { Model3DViewer } from 'app/atoms/Model3DViewer';
import { AssetImage } from 'app/templates/AssetImage';
import { isSvgDataUriInUtf8Encoding, buildObjktCollectibleArtifactUri } from 'lib/images-uri';
import { TokenMetadata } from 'lib/metadata';
import { useLocalStorage } from 'lib/ui/local-storage';

import { AudioCollectible } from '../components/AudioCollectible';
import { CollectibleBlur } from '../components/CollectibleBlur';
import { CollectibleImageFallback } from '../components/CollectibleImageFallback';
import { CollectibleImageLoader } from '../components/CollectibleImageLoader';
import { VideoCollectible } from '../components/VideoCollectible';
import { LOCAL_STORAGE_ADULT_BLUR_TOGGLE_KEY } from '../constants';

interface Props {
  metadata?: TokenMetadata;
  areDetailsLoading: boolean;
  mime?: string | null;
  objktArtifactUri?: string;
  isAdultContent?: boolean;
  className?: string;
}

export const CollectiblePageImage = memo<Props>(
  ({ metadata, mime, objktArtifactUri, className, areDetailsLoading, isAdultContent = false }) => {
    const [adultBlur] = useLocalStorage(LOCAL_STORAGE_ADULT_BLUR_TOGGLE_KEY, true);
    const blurred = isAdultContent && adultBlur;

    const [isRenderFailedOnce, setIsRenderFailedOnce] = useState(false);

    const [shouldShowBlur, setShouldShowBlur] = useState(blurred);
    useEffect(() => setShouldShowBlur(blurred), [blurred]);

    const handleBlurClick = useCallback(() => setShouldShowBlur(false), []);

    const handleError = useCallback(() => setIsRenderFailedOnce(true), []);

    if (areDetailsLoading) {
      return <CollectibleImageLoader large />;
    }

    if (shouldShowBlur) {
      return <CollectibleBlur onClick={handleBlurClick} />;
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
      <AssetImage
        metadata={metadata}
        fullViewCollectible
        loader={<CollectibleImageLoader large />}
        fallback={<CollectibleImageFallback large />}
        className={className}
      />
    );
  }
);
