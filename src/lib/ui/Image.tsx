import React, { useMemo } from 'react';

import ReactImageFallback from 'react-image-fallback';

import { isTruthy } from 'lib/utils';

export interface ImageProps {
  src?: string | (string | undefined)[];
  alt?: string;
  className?: string;
  loader?: React.ReactElement;
  fallback?: React.ReactElement;
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
  onLoad?: EmptyFn;
  onError?: EmptyFn;
}

/*
  Correction to discard React warnings.
  Issue: https://github.com/socialtables/react-image-fallback/issues/49
  PR: https://github.com/socialtables/react-image-fallback/pull/59
*/
ReactImageFallback.prototype.componentDidUpdate = ReactImageFallback.prototype.componentWillReceiveProps;
delete ReactImageFallback.prototype.componentWillReceiveProps;

export const Image: React.FC<ImageProps> = ({ src: sources, alt, loader, fallback, onLoad, onError, ...rest }) => {
  const localFallback = useMemo(() => fallback || <img alt={alt} {...rest} />, [fallback, alt, rest]);

  const { src, fallbackImage } = useMemo(() => {
    let src: string | undefined;
    let fallbackImage: React.ReactElement | (undefined | string | React.ReactElement)[];
    if (Array.isArray(sources)) {
      const filtered = sources.filter(isTruthy);
      src = filtered[0];
      fallbackImage = [...filtered.slice(1), localFallback];
    } else {
      src = sources;
      fallbackImage = localFallback;
    }

    return { src, fallbackImage };
  }, [sources, localFallback]);

  return (
    <ReactImageFallback
      key={src} // We force component recreation on src change
      src={src}
      alt={alt}
      initialImage={loader}
      fallbackImage={fallbackImage as any}
      /** (event: SyntheticEvent | string) => void
       * Fired twice (bug) on successful source found
       */
      onLoad={onLoad}
      /** (event: string) => void
       * Fired once all sources failed to load
       */
      onError={onError}
      {...rest}
    />
  );
};
