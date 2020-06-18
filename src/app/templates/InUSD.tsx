import * as React from "react";
import BigNumber from "bignumber.js";
import {
  ThanosAsset,
  ThanosAssetType,
  XTZ_ASSET,
  useUSDPrice,
} from "lib/thanos/front";
import Money from "app/atoms/Money";

type InUSDProps = {
  volume: BigNumber | number | string;
  asset?: ThanosAsset;
  children: (usdVolume: React.ReactNode) => React.ReactElement;
};

const InUSD: React.FC<InUSDProps> = ({
  volume,
  asset = XTZ_ASSET,
  children,
}) => {
  const price = useUSDPrice();
  return asset.type === ThanosAssetType.XTZ && price !== null
    ? children(<Money fiat>{new BigNumber(volume).times(price)}</Money>)
    : null;
};

export default InUSD;
