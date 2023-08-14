import React, { FC, useCallback, useEffect, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { Model3DViewer } from 'app/atoms/Model3DViewer';
import { useCollectibleIsAdultSelector } from 'app/store/collectibles/selectors';
import { AssetImage } from 'app/templates/AssetImage';
import { TokenMetadata } from 'lib/metadata';
import { isSvgDataUriInUtf8Encoding, buildObjktCollectibleArtifactUri } from 'lib/temple/front';
import { Image } from 'lib/ui/Image';

import { AudioCollectible } from '../components/AudioCollectible';
import { CollectibleBlur } from '../components/CollectibleBlur';
import { CollectibleImageFallback } from '../components/CollectibleImageFallback';
import { CollectibleImageLoader } from '../components/CollectibleImageLoader';
import { VideoCollectible } from '../components/VideoCollectible';

interface Props {
  assetSlug: string;
  metadata?: TokenMetadata;
  areDetailsLoading: boolean;
  mime?: string | null;
  objktArtifactUri?: string;
  className?: string;
}

export const CollectiblePageImage: FC<Props> = ({
  assetSlug,
  metadata,
  mime,
  objktArtifactUri,
  className,
  areDetailsLoading
}) => {
  const [isRenderFailedOnce, setIsRenderFailedOnce] = useState(false);

  const isAdultContent = useCollectibleIsAdultSelector(assetSlug);

  const [shouldShowBlur, setShouldShowBlur] = useState(isAdultContent);
  useEffect(() => setShouldShowBlur(isAdultContent), [isAdultContent]);

  const handleBlurClick = useCallback(() => setShouldShowBlur(false), []);

  const handleError = useCallback(() => setIsRenderFailedOnce(true), []);

  if (areDetailsLoading && !isDefined(isAdultContent)) {
    return <CollectibleImageLoader large />;
  }

  if (shouldShowBlur) {
    return <CollectibleBlur onClick={handleBlurClick} />;
  }

  if (objktArtifactUri && !isRenderFailedOnce) {
    if (isSvgDataUriInUtf8Encoding(objktArtifactUri)) {
      return (
        <Image
          src={objktArtifactUri}
          alt={metadata?.name}
          loader={<CollectibleImageLoader large />}
          onError={handleError}
          className={className}
        />
      );
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
            loader={<CollectibleImageLoader large />}
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
            loader={<CollectibleImageLoader large />}
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
};
