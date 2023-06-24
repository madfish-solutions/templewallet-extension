import React, { useMemo } from 'react';

import ReactImageFallback from 'react-image-fallback';

interface ImageProps {
  src?: string | (string | undefined)[];
  alt?: string;
  className?: string;
  loader?: React.ReactElement;
  fallback?: React.ReactElement;
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
}

/*
  Correction to discard React warnings.
  Issue: https://github.com/socialtables/react-image-fallback/issues/49
  PR: https://github.com/socialtables/react-image-fallback/pull/59
*/
ReactImageFallback.prototype.componentDidUpdate = ReactImageFallback.prototype.componentWillReceiveProps;
delete ReactImageFallback.prototype.componentWillReceiveProps;

export const Image: React.FC<ImageProps> = ({ src: sources, alt, loader, fallback, ...rest }) => {
  const localFallback = useMemo(() => fallback || <img alt={alt} {...rest} />, [alt, rest]);

  const { src, fallbackImage } = useMemo(() => {
    let src: string | undefined;
    let fallbackImage: React.ReactElement | (undefined | string | React.ReactElement)[];
    if (Array.isArray(sources)) {
      sources = sources.filter(Boolean);
      src = sources[0];
      fallbackImage = [...sources.slice(1), localFallback];
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
      {...rest}
    />
  );
};
