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
  /** Draw the first frame once. An animated cover then does not restart when the tile renders again. */
  still?: boolean;
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
  still = false,
  size,
  loader,
  fallback,
  style,
  onStackLoaded,
  onStackFailed,
  ...imgProps
}) => {
  const { src, isLoading, isStackFailed, onSuccess, onFail } = useImagesStackLoading(sources, immediate, progressive);
  const [preventLoadImage, setPreventLoadImage] = useState(isLoading);
  const [frozenSrc, setFrozenSrc] = useState<string | undefined>();
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frozen = Boolean(still && src && frozenSrc === src);

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

    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!still || !src || !img || !canvas || img.naturalWidth <= 0) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) return;

    try {
      context.drawImage(img, 0, 0);
    } catch {
      return;
    }

    setFrozenSrc(src);
  }, [onSuccess, still, src]);

  const onStackFailedRef = useUpdatableRef(onStackFailed);

  useEffect(() => {
    if (isStackFailed) onStackFailedRef.current?.();
  }, [isStackFailed, onStackFailedRef]);

  if (isStackFailed || preventLoadImage) return fallback ?? null;

  return (
    <>
      {isLoading ? (loader ?? null) : null}
      {still && src ? (
        <canvas
          ref={canvasRef}
          className={imgProps.className}
          aria-label={imgProps.alt}
          style={
            frozen
              ? {
                  width: size,
                  height: size,
                  ...style
                }
              : { display: 'none' }
          }
        />
      ) : null}
      {src && !frozen ? (
        <img
          {...imgProps}
          ref={imgRef}
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
