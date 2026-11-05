import React, { memo, ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { CollectibleImageFallback } from 'app/templates/collectibles/collectible-image-fallback';

import { Player } from './VideoPlayer/Player';

interface Props {
  uri: string;
  poster?: ReactNode;
  className?: string;
  onAudioError?: EmptyFn;
}

export const AudioCollectible = memo<Props>(({ uri, poster, className, onAudioError = emptyFn }) => {
  const playerRef = useRef<HTMLAudioElement>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(true);

  useEffect(() => {
    if (isAudioLoading) return;

    playerRef.current?.play().catch(() => undefined);
  }, [isAudioLoading]);

  const handleAudioLoaded = useCallback(() => setIsAudioLoading(false), []);

  return (
    <Player
      ref={playerRef}
      src={uri}
      autoPlay={false}
      audioPlayer
      loop
      audioPoster={poster ?? <CollectibleImageFallback large isAudioCollectible />}
      className={className}
      onLoadedMetadata={handleAudioLoaded}
      onError={onAudioError}
    />
  );
});
