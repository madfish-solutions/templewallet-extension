import React, { FC, useCallback, useEffect, useState } from 'react';

import { Model3DViewer } from 'app/atoms/Model3DViewer';
import { useAllCollectiblesDetailsLoadingSelector } from 'app/store/collectibles/selectors';
import { AssetImage } from 'app/templates/AssetImage';
import { AssetMetadataBase } from 'lib/metadata';

import { AnimatedSvg } from '../components/AnimatedSvg';
import { AudioCollectible } from '../components/AudioCollectible';
import { CollectibleBlur } from '../components/CollectibleBlur';
import { CollectibleImageFallback } from '../components/CollectibleImageFallback';
import { CollectibleImageLoader } from '../components/CollectibleImageLoader';
import { VideoCollectible } from '../components/VideoCollectible';
import { formatCollectibleObjktArtifactUri, isSvgDataUriInUtf8Encoding } from '../utils/image.utils';

interface Props {
  assetSlug: string;
  metadata?: AssetMetadataBase;
  mime?: string | null;
  objktArtifactUri?: string;
  isAdultContent?: boolean;
  large?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const CollectibleImage: FC<Props> = ({
  metadata,
  mime,
  objktArtifactUri,
  assetSlug,
  large,
  className,
  style,
  isAdultContent = false
}) => {
  const [isRenderFailedOnce, setIsRenderFailedOnce] = useState(false);
  const isDetailsLoading = useAllCollectiblesDetailsLoadingSelector();

  const [shouldShowBlur, setShouldShowBlur] = useState<boolean>(isAdultContent);
  const handleBlurClick = useCallback(() => setShouldShowBlur(false), []);

  useEffect(() => setShouldShowBlur(isAdultContent), [isAdultContent]);

  const handleError = useCallback(() => setIsRenderFailedOnce(true), []);

  if (shouldShowBlur) {
    return <CollectibleBlur onClick={handleBlurClick} />;
  }

  if (large && isDetailsLoading) {
    return <CollectibleImageLoader large={large} />;
  }

  if (objktArtifactUri && !isRenderFailedOnce) {
    if (isSvgDataUriInUtf8Encoding(objktArtifactUri)) {
      return (
        <AnimatedSvg
          uri={objktArtifactUri}
          alt={metadata?.name}
          loader={<CollectibleImageLoader large={large} />}
          className={className}
          style={style}
          onError={handleError}
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
            uri={objktArtifactUri}
            loader={<CollectibleImageLoader large={large} />}
            className={className}
            style={style}
            onError={handleError}
          />
        );
      }

      if (mime.startsWith('audio')) {
        return (
          <AudioCollectible
            uri={objktArtifactUri}
            assetSlug={assetSlug}
            metadata={metadata}
            loader={<CollectibleImageLoader large={large} />}
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
      loader={<CollectibleImageLoader large={large} />}
      fallback={<CollectibleImageFallback large={large} />}
      className={className}
      style={style}
    />
  );
};
