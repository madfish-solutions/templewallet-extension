import React, { memo, useEffect, useRef } from 'react';

const starAnimationVideo = require('./star_animation.webm');
const starAnimationPoster = require('./star_animation_poster.gif');

interface Props {
  loop: boolean;
}

export const FirefoxStarAnimation = memo<Props>(({ loop }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prevLoopRef = useRef(loop);

  useEffect(() => {
    if (loop && !prevLoopRef.current) {
      videoRef.current!.play();
    } else if (!loop && prevLoopRef.current) {
      videoRef.current!.currentTime = 0;
      videoRef.current!.pause();
    }
    prevLoopRef.current = loop;
  }, [loop]);

  return (
    <video
      className="w-4 h-4"
      src={starAnimationVideo}
      autoPlay
      muted
      loop={loop}
      ref={videoRef}
      poster={starAnimationPoster}
      controls={false}
      playsInline
      disablePictureInPicture
      disableRemotePlayback
    />
  );
});
