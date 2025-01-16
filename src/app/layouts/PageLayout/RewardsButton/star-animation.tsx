import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

import clsx from 'clsx';

import { useWillUnmount } from 'lib/ui/hooks/useWillUnmount';

import starAnimation from './star_animation_small.gif';

const GIF_DURATION = 3000;
const ORIGINAL_IMG_SIZE = 48;

interface Props {
  loop: boolean;
}

export const StarAnimation = memo<Props>(({ loop }) => {
  const prevLoopRef = useRef(loop);
  const [loopComplete, setLoopComplete] = useState(false);
  const loopTimeoutRef = useRef<NodeJS.Timeout>();
  const animationRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!prevLoopRef.current && loop) {
      animationRef.current!.src = starAnimation;
    }
  }, [loop]);

  useWillUnmount(() => void (loopTimeoutRef.current !== undefined && clearTimeout(loopTimeoutRef.current)));
  const handleAnimationLoad = useCallback(() => {
    if (loopComplete) {
      return;
    }

    loopTimeoutRef.current = setTimeout(() => setLoopComplete(true), GIF_DURATION);
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(animationRef.current!, 0, 0, ORIGINAL_IMG_SIZE, ORIGINAL_IMG_SIZE);
  }, [loopComplete]);

  const isAnimated = loop || !loopComplete;

  return (
    <>
      <img
        src={starAnimation}
        alt=""
        className={clsx('w-4 h-4', !isAnimated && 'invisible')}
        onLoad={handleAnimationLoad}
        ref={animationRef}
      />
      <canvas
        width={ORIGINAL_IMG_SIZE}
        height={ORIGINAL_IMG_SIZE}
        aria-hidden
        // eslint-disable-next-line jsx-a11y/no-interactive-element-to-noninteractive-role
        role="presentation"
        className={clsx(
          isAnimated && 'hidden',
          'absolute top-1/2 transform scale-1/3 -translate-y-1/2 -translate-x-1/3 left-0'
        )}
        ref={canvasRef}
      />
    </>
  );
});
