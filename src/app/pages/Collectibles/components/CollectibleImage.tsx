import React, { FC, useCallback, useEffect, useState } from 'react';

import { ReactComponent as RevealEyeSvg } from 'app/icons/reveal-eye.svg';
import { useAllCollectiblesDetailsLoadingSelector } from 'app/store/collectibles/selectors';
import { AssetImage } from 'app/templates/AssetImage';
import { AssetMetadataBase } from 'lib/metadata';

import { formatCollectibleObjktArtifactUri, isSvgDataUriInUtf8Encoding } from '../utils/image.utils';
import { AnimatedSvg } from './AnimatedSvg';
import { AudioCollectible } from './AudioCollectible';
import { CollectibleImageFallback } from './CollectibleImageFallback';
import { CollectibleImageLoader } from './CollectibleImageLoader';
import BlurImageSrc from './CollectibleItemImage/Blur.png';
import { ModelViewer } from './ModelViewer';
import { VideoCollectible } from './VideoCollectible';

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
    return (
      <button onClick={handleBlurClick} className="relative flex justify-center items-center h-full w-full">
        <img src={BlurImageSrc} alt="Adult content" className="h-full w-full" />
        <RevealEyeSvg className="absolute z-10" color="#718096" />
      </button>
    );
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
          <ModelViewer
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
