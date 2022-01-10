import React, { CSSProperties, memo } from 'react';

import classNames from 'clsx';

import Identicon from 'app/atoms/Identicon';
import { useAssetMetadata, getAssetSymbol } from 'lib/temple/front';

export interface SwapAssetIconProps {
  assetSlug: string;
  className?: string;
  style?: CSSProperties;
  size?: number;
}

interface AssetIconProps extends SwapAssetIconProps {
  thumbnailUri: string | null | undefined;
  imageDisplayed: boolean;
  handleImageError: () => void;
}

const AssetIcon = memo((props: AssetIconProps) => {
  const { assetSlug, thumbnailUri, handleImageError, imageDisplayed, className, style, size } = props;
  const metadata = useAssetMetadata(assetSlug);

  if (thumbnailUri && imageDisplayed) {
    return (
      <img
        src={thumbnailUri}
        alt={metadata?.name}
        className={classNames('overflow-hidden', className)}
        style={{
          width: size,
          height: size,
          ...style
        }}
        onError={handleImageError}
      />
    );
  }

  return <Identicon type="initials" hash={getAssetSymbol(metadata)} className={className} style={style} size={size} />;
});

export default AssetIcon;
