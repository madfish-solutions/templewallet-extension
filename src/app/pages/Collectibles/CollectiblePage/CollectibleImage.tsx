import React, { FC, useCallback, useEffect, useState } from 'react';

import { Model3DViewer } from 'app/atoms/Model3DViewer';
import { AssetImage } from 'app/templates/AssetImage';
import { AssetMetadataBase } from 'lib/metadata';
import { Image } from 'lib/ui/Image';

import { AudioCollectible } from '../components/AudioCollectible';
import { CollectibleBlur } from '../components/CollectibleBlur';
import { CollectibleImageFallback } from '../components/CollectibleImageFallback';
import { CollectibleImageLoader } from '../components/CollectibleImageLoader';
import { VideoCollectible } from '../components/VideoCollectible';
import { formatCollectibleObjktArtifactUri, isSvgDataUriInUtf8Encoding } from '../utils/image.utils';

interface Props {
  assetSlug: string;
  metadata?: AssetMetadataBase;
  areDetailsLoading: boolean;
  mime?: string | null;
  objktArtifactUri?: string;
  isAdultContent?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const CollectibleImage: FC<Props> = ({
  metadata,
  mime,
  objktArtifactUri,
  assetSlug,
  className,
  style,
  areDetailsLoading,
  isAdultContent = false
}) => {
  const [isRenderFailedOnce, setIsRenderFailedOnce] = useState(false);

  const [shouldShowBlur, setShouldShowBlur] = useState(isAdultContent);
  useEffect(() => setShouldShowBlur(isAdultContent), [isAdultContent]);

  const handleBlurClick = useCallback(() => setShouldShowBlur(false), []);

  const handleError = useCallback(() => setIsRenderFailedOnce(true), []);

  if (shouldShowBlur) {
    return <CollectibleBlur onClick={handleBlurClick} />;
  }

  if (areDetailsLoading) {
    return <CollectibleImageLoader large />;
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
          style={style}
        />
      );
    }

    if (mime) {
      if (mime.startsWith('model')) {
        return (
          <Model3DViewer
            uri={formatCollectibleObjktArtifactUri(objktArtifactUri)}
            alt={metadata?.name}
            onError={handleError}
          />
        );
      }

      if (mime.startsWith('video')) {
        return (
          <VideoCollectible
            uri={formatCollectibleObjktArtifactUri(objktArtifactUri)}
            loader={<CollectibleImageLoader large />}
            className={className}
            style={style}
            onError={handleError}
          />
        );
      }

      if (mime.startsWith('audio')) {
        return (
          <AudioCollectible
            uri={formatCollectibleObjktArtifactUri(objktArtifactUri)}
            assetSlug={assetSlug}
            metadata={metadata}
            loader={<CollectibleImageLoader large />}
            className={className}
            style={style}
            onAudioError={handleError}
          />
        );
      }
    }
  }

  return (
    <AssetImage
      metadata={metadata}
      assetSlug={assetSlug}
      loader={<CollectibleImageLoader large />}
      fallback={<CollectibleImageFallback large />}
      className={className}
      style={style}
    />
  );
};
