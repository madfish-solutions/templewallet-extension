import React, { memo, useCallback, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { CollectibleImageLoader } from './CollectibleImageLoader';
import { Player } from './VideoPlayer/Player';

interface Props {
  uri: string;
  className?: string;
  onError?: EmptyFn;
}

export const VideoCollectible = memo<Props>(({ uri, className, onError = emptyFn }) => {
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
      <CollectibleImageLoader large className={isLoading ? undefined : 'hidden'} />
    </>
  );
});
