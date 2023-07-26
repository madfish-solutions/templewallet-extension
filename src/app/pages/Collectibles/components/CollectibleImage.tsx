import React, { FC, useState } from 'react';

import Spinner from 'app/atoms/Spinner/Spinner';
import { ReactComponent as BrokenImageSvg } from 'app/icons/broken-image.svg';
import { ReactComponent as MusicSvg } from 'app/icons/music.svg';
import { useAllCollectiblesDetailsLoadingSelector } from 'app/store/collectibles/selectors';
import { AssetImage } from 'app/templates/AssetImage';
import { AssetMetadataBase } from 'lib/metadata';

import { NonStaticCollectibleMimeTypes } from '../enums/NonStaticMimeTypes.enum';
import { formatCollectibleObjktArtifactUri, isSvgDataUriInUtf8Encoding } from '../utils/image.utils';
import { AnimatedSvg } from './AnimatedSvg';
import { AudioCollectible } from './AudioCollectible';
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

  const handleError = () => setIsRenderFailedOnce(true);

  if (large && isDetailsLoading) {
    return <ImageLoader large={large} />;
  }

  if (objktArtifactUri && !isRenderFailedOnce) {
    if (isSvgDataUriInUtf8Encoding(objktArtifactUri)) {
      return (
        <AnimatedSvg
          uri={objktArtifactUri}
          alt={metadata?.name}
          loader={<ImageLoader large={large} />}
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
              loader={<ImageLoader large />}
              onError={handleError}
            />
          );
        case NonStaticCollectibleMimeTypes.VIDEO_MP4:
        case NonStaticCollectibleMimeTypes.VIDEO_QUICKTIME:
          return (
            <VideoCollectible
              uri={objktArtifactUri}
              loader={<ImageLoader large={large} />}
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
        <AudioCollectible uri={objktArtifactUri} loader={<ImageLoader large={large} />} onError={handleError} />
      )}
      <AssetImage
        metadata={metadata}
        assetSlug={assetSlug}
        loader={<ImageLoader large={large} />}
        fallback={
          <ImageFallback large={large} isAudioCollectible={mime === NonStaticCollectibleMimeTypes.AUDIO_MPEG} />
        }
        className={className}
        style={style}
      />
    </>
  );
};

interface ImageFallbackProps {
  large?: boolean;
  isAudioCollectible?: boolean;
}

const ImageLoader: FC<ImageFallbackProps> = ({ large }) => (
  <div className="w-full h-full flex items-center justify-center">
    <Spinner theme="dark-gray" className={large ? 'w-10' : 'w-8'} />
  </div>
);

const ImageFallback: FC<ImageFallbackProps> = ({ large, isAudioCollectible = false }) => {
  const height = large ? '23%' : '32%';

  return (
    <div className="w-full h-full flex items-center justify-center">
      {isAudioCollectible ? <MusicSvg height={height} /> : <BrokenImageSvg height={height} />}
    </div>
  );
};
