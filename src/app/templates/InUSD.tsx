import React, { FC, ReactElement, ReactNode } from "react";

import BigNumber from "bignumber.js";

import Money from "app/atoms/Money";
import {
  TempleAsset,
  TempleAssetType,
  TEZ_ASSET,
  useUSDPrice,
  useNetwork,
} from "lib/temple/front";

type InUSDProps = {
  volume: BigNumber | number | string;
  asset?: TempleAsset;
  children: (usdVolume: ReactNode) => ReactElement;
  roundingMode?: BigNumber.RoundingMode;
  shortened?: boolean;
  mainnet?: boolean;
};

const InUSD: FC<InUSDProps> = ({
  volume,
  asset = TEZ_ASSET,
  children,
  roundingMode,
  shortened,
  mainnet,
}) => {
  const price = useUSDPrice();
  const walletNetwork = useNetwork();

  if (mainnet === undefined) {
    mainnet = walletNetwork.type === "main";
  }

  return mainnet && asset.type === TempleAssetType.TEZ && price !== null
    ? children(
        <Money fiat roundingMode={roundingMode} shortened={shortened}>
          {new BigNumber(volume).times(price)}
        </Money>
      )
    : null;
};

export default InUSD;
