import React, { FC, useCallback, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';
import clsx from 'clsx';

import { VideoPlayer } from './VideoPlayer/VideoPlayer';

interface Props {
  uri: string;
  loader?: React.ReactElement;
  className?: string;
  onError?: EmptyFn;
}

export const VideoCollectible: FC<Props> = ({ uri, loader, className, onError = emptyFn }) => {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoaded = useCallback(() => setIsLoading(false), []);

  return (
    <>
      <VideoPlayer
        src={uri}
        autoPlay
        loop
        onCanPlayThrough={handleLoaded}
        className={clsx(className, isLoading && 'hidden')}
        onError={onError}
      />
      {isLoading && loader}
    </>
  );
};
