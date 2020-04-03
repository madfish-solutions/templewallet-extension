import * as React from "react";
import BigNumber from "bignumber.js";
import { useUSDPrice } from "lib/thanos/front";
import Money from "app/atoms/Money";

type InUSDProps = {
  volume: BigNumber | number | string;
  children: (usdVolume: React.ReactNode) => React.ReactElement;
};

const InUSD: React.FC<InUSDProps> = ({ volume, children }) => {
  const price = useUSDPrice();
  return price !== null
    ? children(<Money fiat>{new BigNumber(volume).times(price)}</Money>)
    : null;
};

export default InUSD;
