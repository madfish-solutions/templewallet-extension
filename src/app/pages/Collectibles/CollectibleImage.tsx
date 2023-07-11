import React, { FC } from 'react';

import Spinner from 'app/atoms/Spinner/Spinner';
import { ReactComponent as BrokenImageSvg } from 'app/icons/broken-image.svg';
import { AssetImage } from 'app/templates/AssetImage';
import { AssetMetadataBase } from 'lib/metadata';

interface Props {
  assetSlug: string;
  metadata?: AssetMetadataBase;
  large?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const CollectibleImage: FC<Props> = ({ metadata, assetSlug, large, className, style }) => (
  <AssetImage
    metadata={metadata}
    assetSlug={assetSlug}
    loader={<ImageLoader large={large} />}
    fallback={<ImageFallback large={large} />}
    className={className}
    style={style}
  />
);

interface ImageFallbackProps {
  large?: boolean;
}

const ImageLoader: FC<ImageFallbackProps> = ({ large }) => (
  <div className="w-full h-full flex items-center justify-center">
    <Spinner theme="dark-gray" className={large ? 'w-10' : 'w-8'} />
  </div>
);

const ImageFallback: FC<ImageFallbackProps> = ({ large }) => (
  <div className="w-full h-full flex items-center justify-center">
    <BrokenImageSvg height={large ? '23%' : '32%'} />
  </div>
);
