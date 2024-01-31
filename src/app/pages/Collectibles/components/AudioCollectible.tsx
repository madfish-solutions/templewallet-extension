import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { AssetImage } from 'app/templates/AssetImage';
import { AssetMetadataBase } from 'lib/metadata';

import { CollectibleImageFallback } from './CollectibleImageFallback';
import { CollectibleImageLoader } from './CollectibleImageLoader';
import { Player } from './VideoPlayer/Player';

interface Props {
  uri: string;
  metadata?: AssetMetadataBase;
  className?: string;
  style?: React.CSSProperties;
  onAudioError?: EmptyFn;
}

export const AudioCollectible = memo<Props>(({ uri, metadata, className, style, onAudioError = emptyFn }) => {
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
      <Player
        ref={playerRef}
        src={uri}
        autoPlay={false}
        audioPlayer
        loop
        hidden={!ready}
        audioPoster={
          <AssetImage
            metadata={metadata}
            fullViewCollectible
            fallback={<CollectibleImageFallback large isAudioCollectible />}
            className={className}
            style={style}
            onStackLoaded={handleImageLoaded}
            onStackFailed={handleImageLoaded}
          />
        }
        onLoadedMetadata={handleAudioLoaded}
        onError={onAudioError}
      />
      <CollectibleImageLoader large className={ready ? 'hidden' : undefined} />
    </>
  );
});
