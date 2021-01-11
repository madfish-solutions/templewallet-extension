import * as React from "react";
import BigNumber from "bignumber.js";

type MoneyProps = {
  children: number | string | BigNumber;
  fiat?: boolean;
  cryptoDecimals?: number;
  roundingMode?: BigNumber.RoundingMode;
};

const DEFAULT_CRYPTO_DECIMALS = 4;

const Money = React.memo<MoneyProps>(
  ({
    children,
    fiat,
    cryptoDecimals = DEFAULT_CRYPTO_DECIMALS,
    roundingMode = BigNumber.ROUND_UP,
  }) => {
    const bn = new BigNumber(children);
    const decimals = fiat
      ? 2
      : (() => {
          const current = bn.decimalPlaces();
          return current > cryptoDecimals ? cryptoDecimals : current;
        })();
    const result = bn.toFormat(decimals, roundingMode);
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
  }
);

export default Money;
