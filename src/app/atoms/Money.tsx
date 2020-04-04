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
  const result = bn.toFormat(decimals, BigNumber.ROUND_UP);
  const indexOfDot = result.indexOf(".");

  return (
    <>
      {indexOfDot === -1 ? (
        result
      ) : (
        <>
          {result.slice(0, indexOfDot + 1)}
          <span style={{ fontSize: "0.9em" }}>
            {result.slice(indexOfDot + 1, result.length)}
          </span>
        </>
      )}
    </>
  );
});

export default Money;
