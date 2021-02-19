import * as React from "react";
import BigNumber from "bignumber.js";
import {
  ThanosAsset,
  ThanosAssetType,
  TEZ_ASSET,
  useUSDPrice,
} from "lib/thanos/front";
import Money from "app/atoms/Money";

type InUSDProps = {
  volume: BigNumber | number | string;
  asset?: ThanosAsset;
  children: (usdVolume: React.ReactNode) => React.ReactElement;
  roundingMode?: BigNumber.RoundingMode;
};

const InUSD: React.FC<InUSDProps> = ({
  volume,
  asset = TEZ_ASSET,
  children,
  roundingMode,
}) => {
  const price = useUSDPrice();
  return asset.type === ThanosAssetType.TEZ && price !== null
    ? children(
        <Money fiat roundingMode={roundingMode}>
          {new BigNumber(volume).times(price)}
        </Money>
      )
    : null;
};

export default InUSD;
