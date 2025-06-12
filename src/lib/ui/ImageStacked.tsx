import React, { FC, useCallback, useEffect, useMemo, useRef, CSSProperties } from 'react';

import { useImagesStackLoading } from 'lib/ui/use-images-stack-loading';

export interface ImageStackedProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /**
   * (!) Memoize.
   *
   * (i) Don't let empty string (`''`) get inside. Filter to not get endless loader.
   */
  sources: string[];
  size?: number;
  loader?: JSX.Element;
  fallback?: JSX.Element;
  pauseRender?: boolean;
  onStackLoaded?: EmptyFn;
  onStackFailed?: EmptyFn;
}

export const ImageStacked: FC<ImageStackedProps> = ({
  sources,
  size,
  loader,
  fallback,
  style,
  pauseRender,
  onStackLoaded,
  onStackFailed,
  ...imgProps
}) => {
  const { src, isLoading, isStackFailed, onSuccess, onFail } = useImagesStackLoading(sources);

  const styleMemo: CSSProperties | undefined = useMemo(
    () =>
      isLoading
        ? {
            // (i) Cannot set `display: isLoading ? 'none' | 'contents' : undefined`; - `onLoad` won't fire
            width: size,
            height: size,
            position: 'absolute'
          }
        : {
            width: size,
            height: size,
            ...style
          },
    [style, isLoading, size]
  );

  const onStackLoadedRef = useRef(onStackLoaded);

  const onLoadLocal = useCallback(() => {
    onSuccess();
    onStackLoadedRef.current?.();
  }, [onSuccess]);

  useEffect(() => {
    if (isStackFailed && onStackFailed) onStackFailed();
  }, [isStackFailed]);

  if (pauseRender) return null;

  if (isStackFailed) return fallback ?? null;

  return (
    <>
      {isLoading ? loader ?? null : null}
      <img {...imgProps} src={src} style={styleMemo} onLoad={onLoadLocal} onError={onFail} alt={'token logo'} />
    </>
  );
};
