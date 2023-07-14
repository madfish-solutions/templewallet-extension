import React, { FC } from 'react';

import { RevealEye } from 'app/atoms/Reveal-Eye';
import Spinner from 'app/atoms/Spinner/Spinner';
import { ReactComponent as BrokenImageSvg } from 'app/icons/broken-image.svg';
import { AssetImage } from 'app/templates/AssetImage';
import { AssetMetadataBase } from 'lib/metadata';

import Blur from './bg.png';

interface Props {
  assetSlug: string;
  metadata?: AssetMetadataBase;
  isAdultContent?: boolean;
}

export const CollectibleItemImage: FC<Props> = ({ metadata, assetSlug, isAdultContent }) => {
  if (isAdultContent) {
    return (
      <div className="relative flex justify-center items-center h-full w-full">
        <img src={Blur} alt="Adult content" className="h-full w-full" />
        <RevealEye className="absolute z-10" color="#718096" size={32} />
      </div>
    );
  }

  return <AssetImage metadata={metadata} assetSlug={assetSlug} loader={<ImageLoader />} fallback={<ImageFallback />} />;
};

const ImageLoader: FC = () => (
  <div className="w-full h-full flex items-center justify-center">
    <Spinner theme="dark-gray" className="w-8" />
  </div>
);

const ImageFallback: FC = () => (
  <div className="w-full h-full flex items-center justify-center">
    <BrokenImageSvg height="32%" />
  </div>
);
