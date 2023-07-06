import React, { FC } from 'react';

import Spinner from 'app/atoms/Spinner/Spinner';
import { ReactComponent as BrokenImageSvg } from 'app/icons/broken-image.svg';
import { AssetImage } from 'app/templates/AssetImage';
import { AssetMetadataBase } from 'lib/metadata';

interface Props {
  assetSlug: string;
  metadata?: AssetMetadataBase;
}

export const CollectibleItemImage: FC<Props> = ({ metadata, assetSlug }) => (
  <AssetImage metadata={metadata} assetSlug={assetSlug} loader={<ImageLoader />} fallback={<ImageFallback />} />
);

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
