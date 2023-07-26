import React, { CSSProperties, FC, useCallback, useState } from 'react';

import classNames from 'clsx';

import { emptyFn } from 'app/utils/function.utils';

import { formatCollectibleObjktArtifactUri } from '../utils/image.utils';

interface Props {
  uri: string;
  loader?: React.ReactElement;
  className?: string;
  style?: CSSProperties;
  onError?: EmptyFn;
}
export const VideoCollectible: FC<Props> = ({ uri, loader, className, style, onError = emptyFn }) => {
  const [isLoading, setIsLoading] = useState(true);

  const handleCanPlay = useCallback(() => setIsLoading(false), []);
  const handleWaiting = useCallback(() => setIsLoading(true), []);

  return (
    <>
      <video
        autoPlay
        loop
        onCanPlay={handleCanPlay}
        onWaiting={handleWaiting}
        className={classNames(className, isLoading && 'hidden')}
        style={style}
        onError={onError}
      >
        <source src={formatCollectibleObjktArtifactUri(uri)} />
      </video>
      {isLoading && loader}
    </>
  );
};
