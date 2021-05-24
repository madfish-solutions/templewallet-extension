import React, { FC, ReactElement, ReactNode } from "react";

import BigNumber from "bignumber.js";

import Money from "app/atoms/Money";
import {
  TempleAsset,
  TEZ_ASSET,
  useAssetUSDPrice,
  useNetwork,
} from "lib/temple/front";

type InUSDProps = {
  volume: BigNumber | number | string;
  asset?: TempleAsset;
  children: (usdVolume: ReactNode) => ReactElement;
  roundingMode?: BigNumber.RoundingMode;
  mainnet?: boolean;
};

const InUSD: FC<InUSDProps> = ({
  volume,
  asset = TEZ_ASSET,
  children,
  roundingMode,
  mainnet,
}) => {
  const price = useAssetUSDPrice(asset);
  const walletNetwork = useNetwork();

  if (mainnet === undefined) {
    mainnet = walletNetwork.type === "main";
  }

  return mainnet && price !== null
    ? children(
        <Money fiat roundingMode={roundingMode}>
          {new BigNumber(volume).times(price)}
        </Money>
      )
    : null;
};

export default InUSD;
