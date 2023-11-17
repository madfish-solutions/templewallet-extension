import React, { FC, useCallback, useEffect, useMemo, useRef } from 'react';

import { useImagesStackLoading } from 'lib/ui/use-images-stack-loading';

export interface ImageStackedProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /**
   * (!) Memoize.
   *
   * (i) Don't let empty string (`''`) get inside. Filter to not get endless loader.
   */
  sources: string[];
  loader?: JSX.Element;
  fallback?: JSX.Element;
  onStackLoaded?: EmptyFn;
  onStackFailed?: EmptyFn;
}

export const ImageStacked: FC<ImageStackedProps> = ({
  sources,
  loader,
  fallback,
  style,
  onStackLoaded,
  onStackFailed,
  ...imgProps
}) => {
  const { src, isLoading, isStackFailed, onSuccess, onFail } = useImagesStackLoading(sources);

  const styleMemo: React.CSSProperties = useMemo(
    () => ({
      ...style,
      // (i) Cannot set `display: isLoading ? 'none' | 'contents' : undefined`; - `onLoad` won't fire
      width: isLoading ? 0 : undefined,
      height: isLoading ? 0 : undefined
    }),
    [style, isLoading]
  );

  const onStackLoadedRef = useRef(onStackLoaded);

  const onLoadLocal = useCallback(() => {
    onSuccess();
    onStackLoadedRef.current?.();
  }, [onSuccess]);

  useEffect(() => {
    if (isStackFailed && onStackFailed) onStackFailed();
  }, [isStackFailed]);

  if (isStackFailed) return fallback ?? null;

  return (
    <>
      <img {...imgProps} src={src} style={styleMemo} onLoad={onLoadLocal} onError={onFail} />

      {isLoading ? loader ?? null : null}
    </>
  );
};
