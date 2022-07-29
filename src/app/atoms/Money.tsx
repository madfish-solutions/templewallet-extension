import React, { FC, HTMLAttributes, memo, useCallback, useMemo, useRef } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import { toLocalFixed, toLocalFormat, toShortened } from 'lib/i18n/numbers';
import { getNumberSymbols, t } from 'lib/i18n/react';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';
import useTippy, { TippyInstance, TippyProps } from 'lib/ui/useTippy';

type MoneyProps = {
  children: number | string | BigNumber;
  fiat?: boolean;
  cryptoDecimals?: number;
  roundingMode?: BigNumber.RoundingMode;
  shortened?: boolean;
  smallFractionFont?: boolean;
  tooltip?: boolean;
  isSpan?: boolean;
};

const DEFAULT_CRYPTO_DECIMALS = 6;
const ENOUGH_INT_LENGTH = 4;

const Money = memo<MoneyProps>(
  ({
    children,
    fiat,
    cryptoDecimals = DEFAULT_CRYPTO_DECIMALS,
    roundingMode = BigNumber.ROUND_DOWN,
    shortened,
    smallFractionFont = true,
    tooltip = true,
    isSpan = false
  }) => {
    const bn = new BigNumber(children);
    const decimalsLength = bn.decimalPlaces();
    const intLength = bn.integerValue().toFixed().length;
    if (intLength >= ENOUGH_INT_LENGTH) {
      cryptoDecimals = Math.max(cryptoDecimals - 2, 1);
    }
    const { decimal } = getNumberSymbols();

    const deciamlsLimit = decimalsLength > cryptoDecimals ? cryptoDecimals : decimalsLength;

    const decimals = fiat ? 2 : deciamlsLimit;
    let result = shortened ? toShortened(bn) : toLocalFormat(bn, { decimalPlaces: decimals, roundingMode });
    let indexOfDecimal = result.indexOf(decimal) === -1 ? result.indexOf('.') : result.indexOf(decimal);

    const tippyClassName = classNames(
      'truncate',
      'px-px -mr-px rounded cursor-pointer',
      tooltip && 'hover:bg-black hover:bg-opacity-5',
      'transition ease-in-out duration-200'
    );

    if (indexOfDecimal === -1) {
      return <JustMoney isSpan={isSpan} tooltip={tooltip} result={result} className={tippyClassName} bn={bn} />;
    }

    if (!fiat && decimalsLength > cryptoDecimals && !shortened) {
      return (
        <MoneyWithoutFormat
          isSpan={isSpan}
          tooltip={tooltip}
          className={tippyClassName}
          bn={bn}
          cryptoDecimals={cryptoDecimals}
          roundingMode={roundingMode}
          smallFractionFont={smallFractionFont}
        />
      );
    }

    return (
      <MoneyWithFormat
        isSpan={isSpan}
        tooltip={tooltip}
        result={result}
        className={tippyClassName}
        bn={bn}
        isFiat={fiat}
        indexOfDecimal={indexOfDecimal}
        smallFractionFont={smallFractionFont}
      />
    );
  }
);

export default Money;

interface JustMoneyProps {
  tooltip: boolean;
  bn: BigNumber;
  className: string;
  result: string;
  isSpan?: boolean;
}

const JustMoney: FC<JustMoneyProps> = ({ tooltip, bn, className, result, isSpan = false }) => (
  <FullAmountTippy isSpan={isSpan} enabled={tooltip} fullAmount={bn} className={className}>
    {result}
  </FullAmountTippy>
);

interface MoneyWithoutFormatProps {
  tooltip: boolean;
  bn: BigNumber;
  className: string;
  cryptoDecimals: number;
  roundingMode?: BigNumber.RoundingMode;
  smallFractionFont: boolean;
  isSpan?: boolean;
}

const MoneyWithoutFormat: FC<MoneyWithoutFormatProps> = ({
  tooltip,
  bn,
  className,
  cryptoDecimals,
  roundingMode,
  smallFractionFont,
  isSpan = false
}) => {
  const { decimal } = getNumberSymbols();
  const result = toLocalFormat(bn, {
    decimalPlaces: Math.max(cryptoDecimals, 0),
    roundingMode
  });
  const indexOfDecimal = result.indexOf(decimal);

  return (
    <FullAmountTippy isSpan={isSpan} enabled={tooltip} fullAmount={bn} className={className} showAmountTooltip>
      {result.slice(0, indexOfDecimal + 1)}
      <span style={{ fontSize: smallFractionFont ? '0.9em' : undefined }}>
        {result.slice(indexOfDecimal + 1, result.length)}
      </span>
    </FullAmountTippy>
  );
};

interface MoneyWithFormatProps {
  tooltip: boolean;
  bn: BigNumber;
  className: string;
  result: string;
  indexOfDecimal: number;
  smallFractionFont: boolean;
  isFiat?: boolean;
  isSpan?: boolean;
}

const MoneyWithFormat: FC<MoneyWithFormatProps> = ({
  tooltip,
  bn,
  className,
  result,
  indexOfDecimal,
  isFiat,
  smallFractionFont,
  isSpan = false
}) => (
  <FullAmountTippy
    isSpan={isSpan}
    enabled={tooltip}
    fullAmount={isFiat ? new BigNumber(bn.toFixed(2)) : bn}
    className={className}
  >
    {result.slice(0, indexOfDecimal + 1)}
    <span style={{ fontSize: smallFractionFont ? '0.9em' : undefined }}>
      {result.slice(indexOfDecimal + 1, result.length)}
    </span>
  </FullAmountTippy>
);

type FullAmountTippyProps = HTMLAttributes<HTMLDivElement> & {
  fullAmount: BigNumber;
  showAmountTooltip?: boolean;
  enabled?: boolean;
  isSpan?: boolean;
};

const FullAmountTippy: FC<FullAmountTippyProps> = ({
  fullAmount,
  onClick,
  showAmountTooltip,
  enabled = true,
  isSpan = false,
  ...rest
}) => {
  const fullAmountStr = useMemo(() => toLocalFixed(fullAmount), [fullAmount]);

  const { fieldRef, copy, copied, setCopied } = useCopyToClipboard();

  const tippyContent = useMemo(() => {
    if (copied) {
      return t('copiedHash');
    }
    return showAmountTooltip ? fullAmountStr : t('copyHashToClipboard');
  }, [copied, showAmountTooltip, fullAmountStr]);

  const tippyInstanceRef = useRef<TippyInstance>();
  const tippyProps = useMemo<TippyProps>(
    () => ({
      trigger: 'mouseenter',
      hideOnClick: false,
      content: tippyContent,
      animation: 'shift-away-subtle',
      onCreate(instance) {
        tippyInstanceRef.current = instance;
        instance.enable();
      },
      onTrigger(instance) {
        !showAmountTooltip && instance.disable();
      },
      onUntrigger(instance) {
        !showAmountTooltip && instance.disable();
      },
      onHidden() {
        setCopied(false);
      }
    }),
    [tippyContent, showAmountTooltip, setCopied]
  );

  const ref = useTippy<HTMLDivElement>(tippyProps);

  const handleClick = useCallback(
    (evt: React.MouseEvent<HTMLDivElement>) => {
      evt.preventDefault();
      evt.stopPropagation();

      if (!showAmountTooltip) {
        tippyInstanceRef.current?.enable();
        tippyInstanceRef.current?.show();
      }
      copy();
      if (onClick) onClick(evt);
    },
    [copy, onClick, showAmountTooltip]
  );

  if (isSpan) {
    return enabled ? (
      <>
        <span ref={ref} onClick={handleClick} {...(rest as HTMLAttributes<HTMLDivElement>)} />
        <input ref={fieldRef} value={fullAmountStr} readOnly className="sr-only" />
      </>
    ) : (
      <span {...(rest as HTMLAttributes<HTMLDivElement>)} />
    );
  }

  return enabled ? (
    <>
      <div ref={ref} onClick={handleClick} {...(rest as HTMLAttributes<HTMLDivElement>)} />
      <input ref={fieldRef} value={fullAmountStr} readOnly className="sr-only" />
    </>
  ) : (
    <div {...(rest as HTMLAttributes<HTMLDivElement>)} />
  );
};
