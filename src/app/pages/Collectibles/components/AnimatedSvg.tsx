import React, { CSSProperties, FC, useCallback, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';

interface Props {
  uri: string;
  alt?: string;
  loader?: React.ReactElement;
  className?: string;
  style?: CSSProperties;
  onError?: EmptyFn;
}
export const AnimatedSvg: FC<Props> = ({ uri, alt, loader, className, style, onError = emptyFn }) => {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = useCallback(() => setIsLoading(false), []);

  return (
    <>
      <img src={uri} alt={alt} className={className} style={style} onLoad={handleLoad} onError={onError} />
      {isLoading && loader}
    </>
  );
};
