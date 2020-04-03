import * as React from "react";
import BigNumber from "bignumber.js";

type MoneyProps = {
  children: number | string | BigNumber;
  fiat?: boolean;
};

const CRYPTO_DECIMALS = 4;

const Money = React.memo<MoneyProps>(({ children, fiat }) => {
  const bn = new BigNumber(children);
  const decimals = fiat
    ? 2
    : (() => {
        const current = bn.decimalPlaces();
        return current > CRYPTO_DECIMALS ? CRYPTO_DECIMALS : current;
      })();

  return <>{bn.toFormat(decimals, BigNumber.ROUND_UP)}</>;
});

export default Money;
