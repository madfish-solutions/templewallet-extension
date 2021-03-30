import React, { FC, HTMLAttributes, memo, useCallback, useMemo } from "react";

import BigNumber from "bignumber.js";
import classNames from "clsx";

import { t } from "lib/i18n/react";
import useCopyToClipboard from "lib/ui/useCopyToClipboard";
import useTippy from "lib/ui/useTippy";

type MoneyProps = {
  children: number | string | BigNumber;
  fiat?: boolean;
  cryptoDecimals?: number;
  roundingMode?: BigNumber.RoundingMode;
  smallFractionFont?: boolean;
};

const DEFAULT_CRYPTO_DECIMALS = 6;
const ENOUGH_INT_LENGTH = 4;

const Money = memo<MoneyProps>(
  ({
    children,
    fiat,
    cryptoDecimals = DEFAULT_CRYPTO_DECIMALS,
    roundingMode = BigNumber.ROUND_DOWN,
    smallFractionFont = true,
  }) => {
    const bn = new BigNumber(children);
    const decimalsLength = bn.decimalPlaces();
    const intLength = bn.integerValue().toFixed().length;
    if (intLength >= ENOUGH_INT_LENGTH) {
      cryptoDecimals = Math.max(cryptoDecimals - 2, 1);
    }

    const decimals = fiat
      ? 2
      : decimalsLength > cryptoDecimals
      ? cryptoDecimals
      : decimalsLength;
    let result = bn.toFormat(decimals, roundingMode);
    let indexOfDot = result.indexOf(".");

    switch (true) {
      case indexOfDot === -1:
        return <>{result}</>;

      case !fiat && decimalsLength > cryptoDecimals:
        result = bn.toFormat(cryptoDecimals - 2, roundingMode);
        indexOfDot = result.indexOf(".");

        return (
          <FullAmountTippy
            fullAmunt={bn}
            className={classNames(
              "px-px -mr-px",
              "rounded cursor-pointer",
              "hover:bg-black hover:bg-opacity-5",
              "transition ease-in-out duration-200"
            )}
          >
            {result.slice(0, indexOfDot + 1)}
            <span style={{ fontSize: smallFractionFont ? "0.9em" : undefined }}>
              {result.slice(indexOfDot + 1, result.length)}
              <span className="opacity-75 tracking-tighter">...</span>
            </span>
          </FullAmountTippy>
        );

      default:
        return (
          <>
            {result.slice(0, indexOfDot + 1)}
            <span style={{ fontSize: smallFractionFont ? "0.9em" : undefined }}>
              {result.slice(indexOfDot + 1, result.length)}
            </span>
          </>
        );
    }
  }
);

export default Money;

type FullAmountTippyProps = HTMLAttributes<HTMLButtonElement> & {
  fullAmunt: BigNumber;
};

const FullAmountTippy: FC<FullAmountTippyProps> = ({
  fullAmunt,
  onClick,
  ...rest
}) => {
  const fullAmountStr = useMemo(() => fullAmunt.toFixed(), [fullAmunt]);

  const { fieldRef, copy, copied, setCopied } = useCopyToClipboard();

  const tippyProps = useMemo(
    () => ({
      trigger: "mouseenter",
      hideOnClick: false,
      content: copied ? t("copiedHash") : fullAmountStr,
      animation: "shift-away-subtle",
      onHidden() {
        setCopied(false);
      },
    }),
    [fullAmountStr, copied, setCopied]
  );

  const ref = useTippy<HTMLSpanElement>(tippyProps);

  const handleClick = useCallback(
    (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      copy();
      if (onClick) onClick(evt);
    },
    [copy, onClick]
  );

  return (
    <>
      <span ref={ref} onClick={handleClick} {...rest} />
      <input
        ref={fieldRef}
        value={fullAmountStr}
        readOnly
        className="sr-only"
      />
    </>
  );
};
