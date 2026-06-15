import { FC } from 'react';

import { ReactComponent as BrokenImageSvg } from 'app/icons/broken-image.svg';
import { ReactComponent as MusicSvg } from 'app/icons/music.svg';

interface Props {
  large?: boolean;
  isAudioCollectible?: boolean;
}

export const CollectibleImageFallback: FC<Props> = ({ large = false, isAudioCollectible = false }) => {
  const Svg = isAudioCollectible ? MusicSvg : BrokenImageSvg;

  return (
    <div className="w-full h-full flex items-center justify-center">
      <Svg height={large ? '23%' : '32%'} />
    </div>
  );
};
