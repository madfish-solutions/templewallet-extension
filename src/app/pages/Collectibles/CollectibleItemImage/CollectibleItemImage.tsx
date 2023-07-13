import React, { FC } from 'react';

import Spinner from 'app/atoms/Spinner/Spinner';
import { ReactComponent as BrokenImageSvg } from 'app/icons/broken-image.svg';
import { AssetImage } from 'app/templates/AssetImage';
import { TokenMetadata } from 'lib/metadata';

import Blur from './bg.png';

interface Props {
  assetSlug: string;
  metadata?: TokenMetadata;
}

export const CollectibleItemImage: FC<Props> = ({ metadata, assetSlug }) => {
  if (metadata?.isAdultContent) {
    return (
      <div className="flex justify-center items-center h-full w-full">
        <img src={Blur} alt="Adult content" className="h-full w-full" />
        <svg className="absolute z-10" xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none">
          <path
            stroke="#718096"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M18.827 18.827a4.002 4.002 0 0 1-6.636-1.23 4 4 0 0 1 .982-4.424M23.92 23.92A13.427 13.427 0 0 1 16 26.667C6.667 26.667 1.334 16 1.334 16A24.6 24.6 0 0 1 8.08 8.08l15.84 15.84ZM13.2 5.653a12.159 12.159 0 0 1 2.8-.32C25.334 5.333 30.667 16 30.667 16a24.666 24.666 0 0 1-2.88 4.253L13.2 5.653ZM1.333 1.333l29.334 29.334"
          />
        </svg>
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
