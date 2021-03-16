import * as React from "react";
import BigNumber from "bignumber.js";
import {
  TempleAsset,
  TempleAssetType,
  TEZ_ASSET,
  useUSDPrice,
} from "lib/temple/front";
import Money from "app/atoms/Money";

type InUSDProps = {
  volume: BigNumber | number | string;
  asset?: TempleAsset;
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
  return asset.type === TempleAssetType.TEZ && price !== null
    ? children(
        <Money fiat roundingMode={roundingMode}>
          {new BigNumber(volume).times(price)}
        </Money>
      )
    : null;
};

export default InUSD;
