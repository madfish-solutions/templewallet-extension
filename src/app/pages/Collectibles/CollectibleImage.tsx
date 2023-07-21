import React, { FC, useState } from 'react';

import Spinner from 'app/atoms/Spinner/Spinner';
import { ReactComponent as BrokenImageSvg } from 'app/icons/broken-image.svg';
import { ReactComponent as MusicSvg } from 'app/icons/music.svg';
import { useAllCollectiblesDetailsLoadingSelector } from 'app/store/collectibles/selectors';
import { AssetImage } from 'app/templates/AssetImage';
import { AssetMetadataBase } from 'lib/metadata';

import { NonStaticCollectibleMimeTypes } from './NonStaticMimeTypes.enum';
import { SimpleModelViewer } from './SimpleModelViewer';
import { formatCollectibleObjktArtifactUri, isSvgDataUriInUtf8Encoding } from './utils/image.utils';

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
  const [isAnimatedRenderFailed, setIsAnimatedRenderFailed] = useState(false);
  const [isAnimatedLoading, setIsAnimatedLoading] = useState(true);
  const isDetailsLoading = useAllCollectiblesDetailsLoadingSelector();

  const handleError = () => {
    setIsAnimatedRenderFailed(true);
    setIsAnimatedLoading(false);
  };

  const handleAnimatedLoadEnd = () => setIsAnimatedLoading(false);

  if (large && isDetailsLoading) {
    return <ImageLoader large={large} />;
  }

  if (objktArtifactUri && isSvgDataUriInUtf8Encoding(objktArtifactUri) && !isAnimatedRenderFailed) {
    return (
      <>
        <img
          src={objktArtifactUri}
          alt={metadata?.name}
          className={className}
          style={style}
          onLoad={handleAnimatedLoadEnd}
          onError={handleError}
        />
        {isAnimatedLoading && <ImageLoader large />}
      </>
    );
  }

  if (mime && objktArtifactUri && !isAnimatedRenderFailed) {
    if (mime === NonStaticCollectibleMimeTypes.MODEL) {
      return (
        <>
          <SimpleModelViewer
            uri={formatCollectibleObjktArtifactUri(objktArtifactUri)}
            onLoad={handleAnimatedLoadEnd}
            onError={handleError}
          />
          {isAnimatedLoading && <ImageLoader large />}
        </>
      );
    } else if (mime === NonStaticCollectibleMimeTypes.VIDEO) {
      return (
        <>
          <video autoPlay loop onLoad={handleAnimatedLoadEnd} onError={handleError}>
            <source src={formatCollectibleObjktArtifactUri(objktArtifactUri)} type="video/mp4" />
          </video>
          {isAnimatedLoading && <ImageLoader large />}
        </>
      );
    }
  }

  return (
    <>
      {objktArtifactUri && mime === NonStaticCollectibleMimeTypes.AUDIO && !isAnimatedRenderFailed && (
        <>
          <audio
            autoPlay
            loop
            src={formatCollectibleObjktArtifactUri(objktArtifactUri)}
            onLoadedData={handleAnimatedLoadEnd}
            onError={handleError}
          />
          {isAnimatedLoading && <ImageLoader large />}
        </>
      )}
      <AssetImage
        metadata={metadata}
        assetSlug={assetSlug}
        loader={<ImageLoader large={large} />}
        fallback={<ImageFallback large={large} isAudioCollectible={mime === NonStaticCollectibleMimeTypes.AUDIO} />}
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
