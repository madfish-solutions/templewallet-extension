import React, { FC, useCallback, useEffect, useState } from 'react';

import Spinner from 'app/atoms/Spinner/Spinner';
import { ReactComponent as BrokenImageSvg } from 'app/icons/broken-image.svg';
import { ReactComponent as RevealEyeSvg } from 'app/icons/reveal-eye.svg';
import { AssetImage } from 'app/templates/AssetImage';
import { AssetMetadataBase } from 'lib/metadata';

import BlurImageSrc from './CollectibleItemImage/Blur.png';

interface Props {
  assetSlug: string;
  metadata?: AssetMetadataBase;
  large?: boolean;
  className?: string;
  style?: React.CSSProperties;
  isAdultContent?: boolean;
}

export const CollectibleImage: FC<Props> = ({
  metadata,
  assetSlug,
  large,
  className,
  style,
  isAdultContent = false
}) => {
  const [shouldShowBlur, setShouldShowBlur] = useState<boolean>(isAdultContent);
  const handleBlurClick = useCallback(() => setShouldShowBlur(false), []);
  useEffect(() => setShouldShowBlur(isAdultContent), [isAdultContent]);

  if (shouldShowBlur) {
    return (
      <button onClick={handleBlurClick} className="relative flex justify-center items-center h-full w-full">
        <img src={BlurImageSrc} alt="Adult content" className="h-full w-full" />
        <RevealEyeSvg className="absolute z-10" color="#718096" />
      </button>
    );
  }

  return (
    <AssetImage
      metadata={metadata}
      assetSlug={assetSlug}
      loader={<ImageLoader large={large} />}
      fallback={<ImageFallback large={large} />}
      className={className}
      style={style}
    />
  );
};

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
