import React, { memo, useCallback, useState } from 'react';

import { AssetTypesEnum } from 'lib/temple/assets';
import { getThumbnailUri, useAssetMetadata } from 'lib/temple/front';
import useImageLoader from 'lib/ui/useImageLoader';

import AssetIcon from './AssetIcon';
import { SwapAssetIconProps } from './SwapAssetIcon';

type CollectibleAssetIconProps = SwapAssetIconProps & { assetType?: string };

const CollectibleAssetIcon = memo((props: CollectibleAssetIconProps) => {
  const { assetSlug, className, style, size, assetType } = props;
  const [fallbackIcon, setFallbackIcon] = useState<Boolean>(false);
  const metadata = useAssetMetadata(assetSlug);
  const nftSrc = useImageLoader(assetSlug);
  let thumbnailUri;
  const isNft = assetType === AssetTypesEnum.Collectibles && !fallbackIcon;
  if (isNft) {
    thumbnailUri = nftSrc;
  } else {
    thumbnailUri = getThumbnailUri(metadata);
  }

  const [imageDisplayed, setImageDisplayed] = useState(true);
  const handleImageError = useCallback(() => {
    if (isNft) {
      setFallbackIcon(true);
    } else {
      setImageDisplayed(false);
    }
  }, [setImageDisplayed, isNft]);

  return (
    <AssetIcon
      assetSlug={assetSlug}
      imageDisplayed={imageDisplayed}
      thumbnailUri={thumbnailUri}
      handleImageError={handleImageError}
      className={className}
      style={style}
      size={size}
    />
  );
});

export default CollectibleAssetIcon;
