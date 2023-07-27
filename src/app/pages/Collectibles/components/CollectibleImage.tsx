import React, { FC, useCallback, useState } from 'react';

import { useAllCollectiblesDetailsLoadingSelector } from 'app/store/collectibles/selectors';
import { AssetImage } from 'app/templates/AssetImage';
import { AssetMetadataBase } from 'lib/metadata';

import { NonStaticCollectibleMimeTypes } from '../enums/NonStaticMimeTypes.enum';
import { formatCollectibleObjktArtifactUri, isSvgDataUriInUtf8Encoding } from '../utils/image.utils';
import { AnimatedSvg } from './AnimatedSvg';
import { AudioCollectible } from './AudioCollectible';
import { CollectibleImageFallback } from './CollectibleImageFallback';
import { CollectibleImageLoader } from './CollectibleImageLoader';
import { ModelViewer } from './ModelViewer';
import { VideoCollectible } from './VideoCollectible';

interface Props {
  assetSlug: string;
  metadata?: AssetMetadataBase;
  mime?: string | null;
  objktArtifactUri?: string;
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
  style
}) => {
  const [isRenderFailedOnce, setIsRenderFailedOnce] = useState(false);
  const isDetailsLoading = useAllCollectiblesDetailsLoadingSelector();

  const handleError = useCallback(() => setIsRenderFailedOnce(true), []);

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
      switch (mime) {
        case NonStaticCollectibleMimeTypes.MODEL_GLTF_BINARY:
        case NonStaticCollectibleMimeTypes.MODEL_GLTF_JSON:
          return (
            <ModelViewer
              uri={formatCollectibleObjktArtifactUri(objktArtifactUri)}
              loader={<CollectibleImageLoader large />}
              onError={handleError}
            />
          );
        case NonStaticCollectibleMimeTypes.VIDEO_MP4:
        case NonStaticCollectibleMimeTypes.VIDEO_QUICKTIME:
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
    }
  }

  return (
    <>
      {objktArtifactUri && mime === NonStaticCollectibleMimeTypes.AUDIO_MPEG && !isRenderFailedOnce && (
        <AudioCollectible
          uri={objktArtifactUri}
          loader={<CollectibleImageLoader large={large} />}
          onError={handleError}
        />
      )}
      <AssetImage
        metadata={metadata}
        assetSlug={assetSlug}
        loader={<CollectibleImageLoader large={large} />}
        fallback={
          <CollectibleImageFallback
            large={large}
            isAudioCollectible={mime === NonStaticCollectibleMimeTypes.AUDIO_MPEG}
          />
        }
        className={className}
        style={style}
      />
    </>
  );
};
