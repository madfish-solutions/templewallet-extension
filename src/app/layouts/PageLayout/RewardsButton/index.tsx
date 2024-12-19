import React, { memo, useCallback, useRef, useState } from 'react';

import { TestIDProps } from 'lib/analytics';
import { T } from 'lib/i18n';
import { useWillUnmount } from 'lib/ui/hooks/useWillUnmount';
import { Link } from 'lib/woozie';

const starAnimationVideo = require('./star_animation.webm');
const starAnimationPoster = require('./star_animation_poster.gif');

export const RewardsButton = memo<TestIDProps>(props => {
  const [isHovered, setIsHovered] = useState(false);
  const loopTimeoutRef = useRef<NodeJS.Timeout>();
  const videoRef = useRef<HTMLVideoElement>(null);

  console.log('oy vey 1', starAnimationVideo);
  useWillUnmount(() => void (loopTimeoutRef.current !== undefined && clearTimeout(loopTimeoutRef.current)));

  const handleHover = useCallback(() => {
    videoRef.current!.fastSeek(0);
    videoRef.current!.play();
    setIsHovered(true);
  }, []);
  const handleUnhover = useCallback(() => {
    videoRef.current!.fastSeek(0);
    videoRef.current!.pause();
    setIsHovered(false);
  }, []);

  return (
    <Link
      to="/rewards"
      className="bg-blue-150 text-blue-650 rounded-lg px-2 py-1 text-sm font-semibold leading-tight capitalize"
      onMouseEnter={handleHover}
      onMouseLeave={handleUnhover}
      {...props}
    >
      <div className="flex items-center gap-1 relative">
        <video
          className="w-4 h-4"
          src={starAnimationVideo}
          autoPlay
          muted
          loop={isHovered}
          ref={videoRef}
          poster={starAnimationPoster}
          controls={false}
          playsInline
          disablePictureInPicture
          disableRemotePlayback
        />
        <T id="rewards" />
      </div>
    </Link>
  );
});
