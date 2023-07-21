import React, { FC, useState } from 'react';

import Spinner from 'app/atoms/Spinner/Spinner';
import { ReactComponent as BrokenImageSvg } from 'app/icons/broken-image.svg';
import { ReactComponent as MusicSvg } from 'app/icons/music.svg';
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
  const [initialArtifactUri, setInitialArtifactUri] = useState(objktArtifactUri);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setInitialArtifactUri(undefined);
    setIsLoading(false);
  };

  const handleLoadEnd = () => setIsLoading(false);

  if (initialArtifactUri && isSvgDataUriInUtf8Encoding(initialArtifactUri)) {
    return (
      <>
        <img
          src={initialArtifactUri}
          alt={metadata?.name}
          className={className}
          style={style}
          onLoad={handleLoadEnd}
          onError={handleError}
        />
        {isLoading && <ImageLoader large />}
      </>
    );
  }

  if (mime && initialArtifactUri) {
    if (mime === NonStaticCollectibleMimeTypes.MODEL) {
      return (
        <>
          <SimpleModelViewer
            uri={formatCollectibleObjktArtifactUri(initialArtifactUri)}
            onLoad={handleLoadEnd}
            onError={handleError}
          />
          {isLoading && <ImageLoader large />}
        </>
      );
    } else if (mime === NonStaticCollectibleMimeTypes.VIDEO) {
      return (
        <>
          <video autoPlay loop onLoad={handleLoadEnd} onError={handleError}>
            <source src={formatCollectibleObjktArtifactUri(initialArtifactUri)} type="video/mp4" />
          </video>
          {isLoading && <ImageLoader large />}
        </>
      );
    }
  }

  return (
    <>
      {initialArtifactUri && mime === NonStaticCollectibleMimeTypes.AUDIO && (
        <>
          <audio
            autoPlay
            loop
            src={formatCollectibleObjktArtifactUri(initialArtifactUri)}
            onLoad={handleLoadEnd}
            onError={handleError}
          />
          {isLoading && <ImageLoader large />}
        </>
      )}
      <AssetImage
        metadata={metadata}
        assetSlug={assetSlug}
        loader={<ImageLoader large={large} />}
        fallback={<ImageFallback large={large} />}
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
