import React, { CSSProperties, FC, useCallback, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';
import clsx from 'clsx';

interface Props {
  uri: string;
  loader?: React.ReactElement;
  className?: string;
  style?: CSSProperties;
  onError?: EmptyFn;
}

export const VideoCollectible: FC<Props> = ({ uri, loader, className, style, onError = emptyFn }) => {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoaded = useCallback(() => setIsLoading(false), []);

  return (
    <>
      <video
        autoPlay
        loop
        onCanPlayThrough={handleLoaded}
        className={clsx(className, isLoading && 'hidden')}
        style={style}
        onError={onError}
      >
        <source src={uri} />
      </video>
      {isLoading && loader}
    </>
  );
};
