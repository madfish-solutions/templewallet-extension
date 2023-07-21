import React, { CSSProperties, FC, useState } from 'react';

import { emptyFn } from 'app/utils/function.utils';

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

  return (
    <>
      <img
        src={uri}
        alt={alt}
        className={className}
        style={style}
        onLoad={() => setIsLoading(false)}
        onError={onError}
      />
      {isLoading && loader}
    </>
  );
};
