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

import { useDidMount, useUpdatableRef } from 'lib/ui/hooks';
import { type ImageSourceStage } from 'lib/ui/race-image-urls';
import { useImagesStackLoading } from 'lib/ui/use-images-stack-loading';

export interface ImageStackedProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /**
   * (!) Memoize.
   *
   * (i) Don't let empty string (`''`) get inside. Filter to not get endless loader.
   */
  sources: string[] | ImageSourceStage[];
  /** Skip the in-flight cap (detail views). */
  immediate?: boolean;
  /** Load the leading single-URL stages through the `<img>` element and race only the rest off-DOM. */
  progressive?: boolean;
  /** Race a single-URL stack off-DOM too. */
  raced?: boolean;
  /** Don't load while true; a load in progress is aborted. */
  paused?: boolean;
  timeoutMs?: number;
  /** First back-off before a failed stack is tried again on remount. */
  failureBackoffMs?: number;
  size?: number;
  loader?: ReactNode;
  fallback?: ReactNode;
  onStackLoaded?: EmptyFn;
  onStackFailed?: EmptyFn;
}

export const ImageStacked: FC<ImageStackedProps> = ({
  sources,
  immediate = false,
  progressive = false,
  raced = false,
  paused = false,
  timeoutMs,
  failureBackoffMs,
  size,
  loader,
  fallback,
  style,
  onStackLoaded,
  onStackFailed,
  ...imgProps
}) => {
  const { src, isLoading, isStackFailed, onSuccess, onFail } = useImagesStackLoading(sources, {
    immediate,
    progressive,
    raced,
    timeoutMs,
    paused,
    failureBackoffMs
  });
  const [preventLoadImage, setPreventLoadImage] = useState(isLoading);

  useDidMount(() => startTransition(() => setPreventLoadImage(false)));

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

  const onStackFailedRef = useUpdatableRef(onStackFailed);

  useEffect(() => {
    if (isStackFailed) onStackFailedRef.current?.();
  }, [isStackFailed, onStackFailedRef]);

  if (isStackFailed || preventLoadImage) return fallback ?? null;

  return (
    <>
      {isLoading ? (loader ?? null) : null}
      {src ? (
        <img
          {...imgProps}
          alt={isLoading ? '' : imgProps.alt}
          src={src}
          style={styleMemo}
          onLoad={onLoadLocal}
          onError={onFail}
        />
      ) : null}
    </>
  );
};
