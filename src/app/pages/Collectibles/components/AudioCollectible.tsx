import React, { FC, useCallback, useEffect, useRef, useState } from 'react';

import { AssetImage } from 'app/templates/AssetImage';
import { emptyFn } from 'app/utils/function.utils';
import { AssetMetadataBase } from 'lib/metadata';

import { formatCollectibleObjktArtifactUri } from '../utils/image.utils';
import { CollectibleImageFallback } from './CollectibleImageFallback';

interface Props {
  uri: string;
  assetSlug: string;
  metadata?: AssetMetadataBase;
  loader?: React.ReactElement;
  className?: string;
  style?: React.CSSProperties;
  onAudioError?: EmptyFn;
}
export const AudioCollectible: FC<Props> = ({
  uri,
  metadata,
  assetSlug,
  className,
  style,
  loader,
  onAudioError = emptyFn
}) => {
  const playerRef = useRef<HTMLAudioElement>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(true);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const ready = !isAudioLoading && !isImageLoading;

  useEffect(() => {
    if (ready) {
      playerRef.current?.play();
    }
  }, [ready]);

  const handleAudioLoaded = useCallback(() => setIsAudioLoading(false), []);
  const handleImageLoaded = useCallback(() => setIsImageLoading(false), []);

  return (
    <>
      <audio
        ref={playerRef}
        src={formatCollectibleObjktArtifactUri(uri)}
        loop
        onCanPlayThrough={handleAudioLoaded}
        onError={onAudioError}
      />
      <AssetImage
        metadata={metadata}
        assetSlug={assetSlug}
        fallback={<CollectibleImageFallback large isAudioCollectible />}
        className={className}
        style={style}
        onLoad={handleImageLoaded}
      />
      {!ready && loader}
    </>
  );
};
