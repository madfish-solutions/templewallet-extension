import React, { CSSProperties, memo, useCallback, useState } from 'react';

import classNames from 'clsx';

import Identicon from 'app/atoms/Identicon';
import { useAssetMetadata, getAssetSymbol, getThumbnailUri } from 'lib/temple/front';

export type AssetIconProps = {
  assetSlug: string;
  className?: string;
  style?: CSSProperties;
  size?: number;
};

const AssetIcon = memo((props: AssetIconProps) => {
  const { assetSlug, className, style, size } = props;
  const metadata = useAssetMetadata(assetSlug);
  const thumbnailUri = getThumbnailUri(metadata);

  const [imageDisplayed, setImageDisplayed] = useState(true);
  const handleImageError = useCallback(() => {
    setImageDisplayed(false);
  }, [setImageDisplayed]);

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
