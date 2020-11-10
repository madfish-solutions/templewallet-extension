import React from "react";
import { ThanosAsset } from "lib/thanos/types";
import { getAssetIconUrl } from "app/defaults";
import Identicon from "app/atoms/Identicon";

export type AssetIconProps = {
  asset: ThanosAsset;
  className?: string;
  style?: React.CSSProperties;
  size?: number;
};

const AssetIcon = React.memo((props: AssetIconProps) => {
  const { asset, className, style, size } = props;
  const assetIconUrl = getAssetIconUrl(asset);

  if (assetIconUrl) {
    return (
      <img
        src={assetIconUrl}
        alt={asset.name}
        className={className}
        style={style}
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
