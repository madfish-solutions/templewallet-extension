import React, { FC, HTMLAttributes, memo, useCallback, useMemo } from "react";

import BigNumber from "bignumber.js";
import classNames from "clsx";

import { toLocalFixed, toLocalFormat } from "lib/i18n/numbers";
import { getNumberSymbols, t } from "lib/i18n/react";
import useCopyToClipboard from "lib/ui/useCopyToClipboard";
import useTippy from "lib/ui/useTippy";

type MoneyProps = {
  children: number | string | BigNumber;
  fiat?: boolean;
  cryptoDecimals?: number;
  roundingMode?: BigNumber.RoundingMode;
};

const DEFAULT_CRYPTO_DECIMALS = 6;
const ENOUGH_INT_LENGTH = 4;

const Money = memo<MoneyProps>(
  ({
    children,
    fiat,
    cryptoDecimals = DEFAULT_CRYPTO_DECIMALS,
    roundingMode = BigNumber.ROUND_DOWN,
  }) => {
    const bn = new BigNumber(children);
    const decimalsLength = bn.decimalPlaces();
    const intLength = bn.integerValue().toFixed().length;
    if (intLength >= ENOUGH_INT_LENGTH) {
      cryptoDecimals = Math.max(cryptoDecimals - 2, 1);
    }
    const { decimal } = getNumberSymbols();

    const decimals = fiat
      ? 2
      : decimalsLength > cryptoDecimals
      ? cryptoDecimals
      : decimalsLength;
    let result = toLocalFormat(bn, { decimalPlaces: decimals, roundingMode });
    let indexOfDecimal = result.indexOf(decimal);

    const tippyClassName = classNames(
      "px-px -mr-px rounded cursor-pointer hover:bg-black",
      "hover:bg-opacity-5 transition ease-in-out duration-200"
    );

    switch (true) {
      case indexOfDecimal === -1:
        return (
          <FullAmountTippy fullAmount={bn} className={tippyClassName}>
            {result}
          </FullAmountTippy>
        );

      case !fiat && decimalsLength > cryptoDecimals:
        result = toLocalFormat(bn, {
          decimalPlaces: cryptoDecimals - 2,
          roundingMode,
        });
        indexOfDecimal = result.indexOf(decimal);

        return (
          <FullAmountTippy
            fullAmount={bn}
            className={tippyClassName}
            showAmountTooltip
          >
            {result.slice(0, indexOfDecimal + 1)}
            <span style={{ fontSize: "0.9em" }}>
              {result.slice(indexOfDecimal + 1, result.length)}
              <span className="opacity-75 tracking-tighter">...</span>
            </span>
          </FullAmountTippy>
        );

      default:
        return (
          <FullAmountTippy fullAmount={bn} className={tippyClassName}>
            {result.slice(0, indexOfDecimal + 1)}
            <span style={{ fontSize: "0.9em" }}>
              {result.slice(indexOfDecimal + 1, result.length)}
            </span>
          </FullAmountTippy>
        );
    }
  }
);

export default Money;

type FullAmountTippyProps = HTMLAttributes<HTMLButtonElement> & {
  fullAmount: BigNumber;
  showAmountTooltip?: boolean;
};

const FullAmountTippy: FC<FullAmountTippyProps> = ({
  fullAmount,
  onClick,
  showAmountTooltip,
  ...rest
}) => {
  const fullAmountStr = useMemo(() => toLocalFixed(fullAmount), [fullAmount]);

  const { fieldRef, copy, copied, setCopied } = useCopyToClipboard();

  const tippyContent = useMemo(() => {
    if (copied) {
      return t("copiedAmount");
    }
    return showAmountTooltip ? fullAmountStr : t("copyAmountToClipboard");
  }, [copied, showAmountTooltip, fullAmountStr]);

  const tippyProps = useMemo(
    () => ({
      trigger: "mouseenter",
      hideOnClick: false,
      content: tippyContent,
      animation: "shift-away-subtle",
      onHidden() {
        setCopied(false);
      },
    }),
    [tippyContent, setCopied]
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
