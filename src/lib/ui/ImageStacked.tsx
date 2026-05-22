import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  CSSProperties,
  ReactNode,
  useState,
  startTransition
} from 'react';

import { useImagesStackLoading } from 'lib/ui/use-images-stack-loading';

export interface ImageStackedProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /**
   * (!) Memoize.
   *
   * (i) Don't let empty string (`''`) get inside. Filter to not get endless loader.
   */
  sources: string[];
  size?: number;
  loader?: ReactNode;
  fallback?: ReactNode;
  onStackLoaded?: EmptyFn;
  onStackFailed?: EmptyFn;
}

export const ImageStacked: FC<ImageStackedProps> = ({
  sources,
  size,
  loader,
  fallback,
  style,
  onStackLoaded,
  onStackFailed,
  ...imgProps
}) => {
  const [preventLoadImage, setPreventLoadImage] = useState(true);
  const { src, isLoading, isStackFailed, onSuccess, onFail } = useImagesStackLoading(sources);

  useEffect(() => {
    startTransition(() => setPreventLoadImage(false));

    return () => setPreventLoadImage(true);
  }, []);

  const styleMemo: CSSProperties | undefined = useMemo(
    () =>
      isLoading
        ? {
            // (i) Cannot set `display: isLoading ? 'none' | 'contents' : undefined`; - `onLoad` won't fire
            width: size,
            height: size,
            position: 'absolute',
            opacity: 0
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

  if (isStackFailed || preventLoadImage) return fallback ?? null;

  return (
    <>
      {isLoading ? (loader ?? null) : null}
      <img
        {...imgProps}
        alt={isLoading ? '' : imgProps.alt}
        src={src}
        style={styleMemo}
        onLoad={onLoadLocal}
        onError={onFail}
      />
    </>
  );
};
