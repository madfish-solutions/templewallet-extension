import React, { memo } from 'react';

import { ReactComponent as BrokenImageSvg } from 'app/icons/broken-image.svg';
import { ReactComponent as MusicSvg } from 'app/icons/music.svg';

interface Props {
  large?: boolean;
  isAudioCollectible?: boolean;
}

export const CollectibleImageFallback = memo<Props>(({ large = false, isAudioCollectible = false }) => {
  const height = large ? '23%' : '32%';

  return (
    <div className="w-full h-full flex items-center justify-center">
      {isAudioCollectible ? <MusicSvg height={height} /> : <BrokenImageSvg height={height} />}
    </div>
  );
});
