import React, { CSSProperties, memo, useCallback, useState } from "react";

import classNames from "clsx";

import Identicon from "app/atoms/Identicon";
import { getAssetIconUrl } from "app/defaults";
import { TempleAsset } from "lib/temple/types";
export type AssetIconProps = {
  asset: TempleAsset;
  className?: string;
  style?: CSSProperties;
  size?: number;
};

const AssetIcon = memo((props: AssetIconProps) => {
  const { asset, className, style, size } = props;
  const assetIconUrl = getAssetIconUrl(asset);

  const [imageDisplayed, setImageDisplayed] = useState(true);
  const handleImageError = useCallback(() => {
    setImageDisplayed(false);
  }, [setImageDisplayed]);

  if (assetIconUrl && imageDisplayed) {
    return (
      <img
        src={assetIconUrl}
        alt={asset.name}
        className={classNames("overflow-hidden", className)}
        style={{
          width: size,
          height: size,
          ...style,
        }}
        onError={handleImageError}
      />
    );
  }

  return (
    <Identicon
      type="initials"
      hash={asset.symbol}
      className={className}
      style={style}
      size={size}
    />
  );
});

export default AssetIcon;
