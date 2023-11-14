import React, { useMemo } from 'react';

import { isTruthy } from 'lib/utils';

import ReactImageFallback from './react-image-fallback';

export interface ImageProps {
  sources?: string | (string | undefined)[];
  loader?: React.ReactNode;
  fallback?: React.ReactNode;
  lazy?: boolean;
  onLoaded?: EmptyFn;
  onError?: EmptyFn;
  // <img /> props
  alt?: string;
  className?: string;
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
}

export const Image: React.FC<ImageProps> = ({
  sources,
  loader,
  fallback,
  lazy,
  onLoaded,
  onError,
  // <img /> props
  alt,
  className,
  width,
  height,
  style
}) => {
  const imgProps = useMemo(
    () => ({
      className,
      width,
      height,
      style,
      alt,
      loading: lazy ? ('lazy' as const) : undefined
    }),
    [className, width, height, style, alt, lazy]
  );

  const localFallback = useMemo(() => fallback || <img {...imgProps} />, [fallback, imgProps]);

  const { src, key, fallbackImage } = useMemo(() => {
    let src: string | undefined;
    let key: string;
    let fallbackImage: (string | React.ReactNode)[];
    if (Array.isArray(sources)) {
      const filtered = sources.filter(isTruthy);
      src = filtered[0];
      key = filtered.toString();
      fallbackImage = [...filtered.slice(1), localFallback];
    } else {
      src = sources;
      key = String(src);
      fallbackImage = [localFallback];
    }

    return { src, key, fallbackImage };
  }, [sources, localFallback]);

  return (
    <ReactImageFallback
      key={key} // We force component recreation on sources change
      src={src}
      initialImage={loader}
      fallbackImage={fallbackImage}
      onLoaded={onLoaded}
      onError={onError}
      imgProps={imgProps}
    />
  );
};
