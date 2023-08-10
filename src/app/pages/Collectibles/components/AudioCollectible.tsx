import React, { FC, useCallback, useEffect, useRef, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { AssetImage } from 'app/templates/AssetImage';
import { AssetMetadataBase } from 'lib/metadata';

import { CollectibleImageFallback } from './CollectibleImageFallback';

interface Props {
  uri: string;
  metadata?: AssetMetadataBase;
  loader?: React.ReactElement;
  className?: string;
  style?: React.CSSProperties;
  onAudioError?: EmptyFn;
}
export const AudioCollectible: FC<Props> = ({ uri, metadata, className, style, loader, onAudioError = emptyFn }) => {
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
      <audio ref={playerRef} src={uri} loop onCanPlayThrough={handleAudioLoaded} onError={onAudioError} />

      <AssetImage
        metadata={metadata}
        large
        fallback={<CollectibleImageFallback large isAudioCollectible />}
        className={className}
        style={style}
        onLoad={handleImageLoaded}
      />

      {!ready && loader}
    </>
  );
};
