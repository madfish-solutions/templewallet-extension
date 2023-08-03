import React, { FC } from 'react';

import { ReactComponent as BrokenImageSvg } from 'app/icons/broken-image.svg';
import { ReactComponent as MusicSvg } from 'app/icons/music.svg';

interface ImageFallbackProps {
  large?: boolean;
  isAudioCollectible?: boolean;
}

export const CollectibleImageFallback: FC<ImageFallbackProps> = ({ large = false, isAudioCollectible = false }) => {
  const height = large ? '23%' : '32%';

  return (
    <div className="w-full h-full flex items-center justify-center">
      {isAudioCollectible ? <MusicSvg height={height} /> : <BrokenImageSvg height={height} />}
    </div>
  );
};
