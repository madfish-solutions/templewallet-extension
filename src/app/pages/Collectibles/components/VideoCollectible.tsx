import React, { memo, ReactNode, useCallback, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { CollectibleImageLoader } from 'app/templates/collectibles/collectible-image-loader';

import { Player } from './VideoPlayer/Player';

interface Props {
  uri: string;
  className?: string;
  /** Still shown until the video file can play. */
  poster?: ReactNode;
  onError?: EmptyFn;
}

export const VideoCollectible = memo<Props>(({ uri, className, poster, onError = emptyFn }) => {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoaded = useCallback(() => setIsLoading(false), []);

  return (
    <>
      <Player
        src={uri}
        loop
        onLoadedMetadata={handleLoaded}
        hidden={isLoading}
        className={className}
        onError={onError}
      />
      {isLoading ? (poster ?? <CollectibleImageLoader large />) : null}
    </>
  );
});
