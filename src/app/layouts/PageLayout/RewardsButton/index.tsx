import React, { memo, useCallback, useRef, useState } from 'react';

import clsx from 'clsx';

import { TestIDProps } from 'lib/analytics';
import { T } from 'lib/i18n';
import { useWillUnmount } from 'lib/ui/hooks/useWillUnmount';
import { Link } from 'lib/woozie';

import starAnimation from './star_animation_small.gif';

const GIF_DURATION = 3000;
const ORIGINAL_IMG_SIZE = 48;

export const RewardsButton = memo<TestIDProps>(props => {
  const [isHovered, setIsHovered] = useState(false);
  const [loopComplete, setLoopComplete] = useState(false);
  const loopTimeoutRef = useRef<NodeJS.Timeout>();
  const animationRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useWillUnmount(() => void (loopTimeoutRef.current !== undefined && clearTimeout(loopTimeoutRef.current)));
  const handleAnimationLoad = useCallback(() => {
    loopTimeoutRef.current = setTimeout(() => setLoopComplete(true), GIF_DURATION);

    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(animationRef.current!, 0, 0, ORIGINAL_IMG_SIZE, ORIGINAL_IMG_SIZE);
  }, []);

  const handleHover = useCallback(() => setIsHovered(true), []);
  const handleUnhover = useCallback(() => setIsHovered(false), []);

  const isAnimated = isHovered || !loopComplete;

  return (
    <Link
      to="/rewards"
      className="bg-blue-150 text-blue-650 rounded-lg px-2 py-1 text-sm font-semibold leading-tight capitalize"
      onMouseEnter={handleHover}
      onMouseLeave={handleUnhover}
      {...props}
    >
      <div className="flex items-center gap-1 relative">
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
          role="presentation"
          className={clsx(
            isAnimated && 'hidden',
            'absolute top-1/2 transform scale-1/3 -translate-y-1/2 -translate-x-1/3 left-0'
          )}
          ref={canvasRef}
        />
        <T id="rewards" />
      </div>
    </Link>
  );
});
