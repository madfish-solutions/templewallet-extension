import React, { FC, useCallback, useState } from 'react';

import { formatImgUri, sanitizeImgUri } from 'lib/image-uri';
import { AssetMetadata } from 'lib/temple/metadata';
import useImageLoader from 'lib/ui/useImageLoader';

interface Props {
  collectibleMetadata: AssetMetadata;
  Placeholder: React.FunctionComponent<any>;
  className?: string;
  assetSlug: string;
}

const CollectibleImage: FC<Props> = ({ collectibleMetadata, assetSlug, Placeholder, className }) => {
  const assetSrc = useImageLoader(assetSlug);
  const [isLoaded, setIsLoaded] = useState(false);
  const [fallbackIcon, setFallbackIcon] = useState<Boolean>(false);

  let thumbnailUri;
  const isNft = !fallbackIcon;
  if (isNft) {
    thumbnailUri = assetSrc;
  } else {
    thumbnailUri = sanitizeImgUri(formatImgUri(collectibleMetadata.thumbnailUri), 512, 512);
  }

  const handleImageError = useCallback(() => {
    if (isNft) {
      setFallbackIcon(true);
    }
  }, [isNft]);

  return (
    <>
      <img
        onLoad={() => setIsLoaded(true)}
        alt={collectibleMetadata.name}
        style={!isLoaded ? { display: 'none' } : {}}
        className={className}
        src={thumbnailUri}
        onError={handleImageError}
      />
      {!isLoaded && <Placeholder style={{ display: 'inline' }} />}
    </>
  );
};

export default CollectibleImage;
