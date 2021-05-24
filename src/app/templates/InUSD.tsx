import React, { FC, ReactElement, ReactNode, useMemo } from "react";

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
  shortened?: boolean;
  smallFractionFont?: boolean;
  mainnet?: boolean;
  showCents?: boolean;
};

const InUSD: FC<InUSDProps> = ({
  volume,
  asset = TEZ_ASSET,
  children,
  roundingMode,
  shortened,
  smallFractionFont,
  mainnet,
  showCents = true,
}) => {
  const price = useAssetUSDPrice(asset);
  const walletNetwork = useNetwork();

  if (mainnet === undefined) {
    mainnet = walletNetwork.type === "main";
  }
  const roundedInUSD = useMemo(() => {
    if (price === null) {
      return new BigNumber(0);
    }
    const inUSD = new BigNumber(volume).times(price);
    if (showCents) {
      return inUSD;
    }
    return inUSD.integerValue();
  }, [price, showCents, volume]);

  return mainnet && price !== null
    ? children(
        <Money
          fiat={showCents}
          cryptoDecimals={showCents ? undefined : 0}
          roundingMode={roundingMode}
          shortened={shortened}
          smallFractionFont={smallFractionFont}
        >
          {roundedInUSD}
        </Money>
      )
    : null;
};

export default InUSD;
