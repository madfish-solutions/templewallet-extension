import React, { FC } from 'react';

import { ReactComponent as RevealEyeSvg } from 'app/icons/reveal-eye.svg';
import { AssetImage } from 'app/templates/AssetImage';
import { AssetMetadataBase } from 'lib/metadata';

import { NonStaticCollectibleMimeTypes } from '../../enums/NonStaticMimeTypes.enum';
import { CollectibleImageFallback } from '../CollectibleImageFallback';
import { CollectibleImageLoader } from '../CollectibleImageLoader';
import BlurImageSrc from './Blur.png';

interface Props {
  assetSlug: string;
  metadata?: AssetMetadataBase;
  mime?: string | null;
  isAdultContent?: boolean;
}

export const CollectibleItemImage: FC<Props> = ({ metadata, mime, assetSlug, isAdultContent }) => {
  if (isAdultContent) {
    return (
      <div className="relative flex justify-center items-center h-full w-full">
        <img src={BlurImageSrc} alt="Adult content" className="h-full w-full" />
        <RevealEyeSvg className="absolute z-10" color="#718096" />
      </div>
    );
  }

  return (
    <AssetImage
      metadata={metadata}
      assetSlug={assetSlug}
      loader={<CollectibleImageLoader />}
      fallback={<CollectibleImageFallback isAudioCollectible={mime === NonStaticCollectibleMimeTypes.AUDIO_MPEG} />}
    />
  );
};
