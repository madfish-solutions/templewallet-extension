import React, { FC, HTMLAttributes, memo, useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';
import { Placement } from 'tippy.js';

import { toastSuccess } from 'app/toaster';
import { AnalyticsEventCategory, setTestID, TestIDProps, useAnalytics } from 'lib/analytics';
import { getNumberSymbols, toLocalFixed, toLocalFormat, toShortened, t } from 'lib/i18n';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';
import useTippy, { UseTippyOptions } from 'lib/ui/useTippy';

interface MoneyProps extends TestIDProps {
  children: number | string | BigNumber;
  fiat?: boolean;
  cryptoDecimals?: number;
  roundingMode?: BigNumber.RoundingMode;
  shortened?: boolean;
  smallFractionFont?: boolean;
  /** To show the '+' sign */
  withSign?: boolean;
  tooltip?: boolean;
  tooltipPlacement?: Placement;
}

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
    withSign,
    tooltip = true,
    tooltipPlacement,
    testID,
    testIDProperties
  }) => {
    const bn = new BigNumber(children);

    const decimalsLength = bn.decimalPlaces() ?? 0;
    const intLength = bn.integerValue().toFixed().length;
    if (intLength >= ENOUGH_INT_LENGTH) {
      cryptoDecimals = Math.max(cryptoDecimals - 2, 1);
    }
    const { decimal } = getNumberSymbols();

    const deciamlsLimit = decimalsLength > cryptoDecimals ? cryptoDecimals : decimalsLength;

    const decimals = fiat ? 2 : deciamlsLimit;
    const result = shortened ? toShortened(bn) : toLocalFormat(bn, { decimalPlaces: decimals, roundingMode });

    const indexOfDecimal = result.indexOf(decimal) === -1 ? result.indexOf('.') : result.indexOf(decimal);

    const tippyClassName = classNames(
      'px-px -mr-px rounded truncate',
      tooltip && 'cursor-pointer hover:bg-black hover:bg-opacity-5 transition ease-in-out duration-200'
    );

    if (indexOfDecimal === -1) {
      return (
        <JustMoney
          tooltip={tooltip}
          result={result}
          className={tippyClassName}
          tooltipPlacement={tooltipPlacement}
          bn={bn}
          withSign={withSign}
          testID={testID}
          testIDProperties={testIDProperties}
        />
      );
    }

    if (!fiat && !shortened && decimalsLength > cryptoDecimals) {
      return (
        <MoneyWithoutFormat
          tooltip={tooltip}
          tooltipPlacement={tooltipPlacement}
          className={tippyClassName}
          bn={bn}
          cryptoDecimals={cryptoDecimals}
          roundingMode={roundingMode}
          smallFractionFont={smallFractionFont}
          withSign={withSign}
          testID={testID}
          testIDProperties={testIDProperties}
        />
      );
    }

    return (
      <MoneyWithFormat
        tooltip={tooltip}
        tooltipPlacement={tooltipPlacement}
        result={result}
        className={tippyClassName}
        bn={bn}
        isFiat={fiat}
        indexOfDecimal={indexOfDecimal}
        smallFractionFont={smallFractionFont}
        withSign={withSign}
        testID={testID}
        testIDProperties={testIDProperties}
      />
    );
  }
);

export default Money;

interface JustMoneyProps extends TestIDProps {
  tooltip: boolean;
  bn: BigNumber;
  className: string;
  result: string;
  withSign?: boolean;
  tooltipPlacement?: Placement;
}

const JustMoney: FC<JustMoneyProps> = ({
  tooltip,
  bn,
  className,
  result,
  withSign,
  tooltipPlacement,
  testID,
  testIDProperties
}) => (
  <FullAmountTippy
    enabled={tooltip}
    fullAmount={bn}
    className={className}
    tooltipPlacement={tooltipPlacement}
    testID={testID}
    testIDProperties={testIDProperties}
  >
    {withSign && bn.isPositive() && '+'}
    {result}
  </FullAmountTippy>
);

interface MoneyAnyFormatPropsBase extends TestIDProps {
  tooltip: boolean;
  bn: BigNumber;
  className: string;
  smallFractionFont: boolean;
  withSign?: boolean;
  tooltipPlacement?: Placement;
}

interface MoneyWithoutFormatProps extends MoneyAnyFormatPropsBase {
  cryptoDecimals: number;
  roundingMode?: BigNumber.RoundingMode;
}

const FORMATTING_THRESHOLD = 1000;
const PRECISION_MULTIPLIER = 100;

const formatAmount = (amount: BigNumber) => {
  const isLessThanThreshold = amount.isLessThanOrEqualTo(FORMATTING_THRESHOLD);

  if (isLessThanThreshold) return { amount, isLessThanThreshold };

  const numberAmount = Number(amount);
  const roundingAccuracy = Math.floor(numberAmount * PRECISION_MULTIPLIER) / PRECISION_MULTIPLIER;

  return { amount: new BigNumber(roundingAccuracy.toFixed(2)), isLessThanThreshold };
};

const MoneyWithoutFormat: FC<MoneyWithoutFormatProps> = ({
  tooltip,
  bn,
  className,
  cryptoDecimals,
  roundingMode,
  smallFractionFont,
  withSign,
  tooltipPlacement,
  testID,
  testIDProperties
}) => {
  const { decimal } = getNumberSymbols();

  const { amount, isLessThanThreshold } = formatAmount(bn);

  const result = toLocalFormat(amount, {
    decimalPlaces: isLessThanThreshold ? Math.max(cryptoDecimals, 0) : 2,
    roundingMode
  });
  const indexOfDecimal = result.indexOf(decimal);

  return (
    <FullAmountTippy
      enabled={tooltip}
      fullAmount={bn}
      className={className}
      tooltipPlacement={tooltipPlacement}
      showAmountTooltip
      testID={testID}
      testIDProperties={testIDProperties}
    >
      {withSign && bn.isPositive() && '+'}
      {result.slice(0, indexOfDecimal + 1)}
      <span style={{ fontSize: smallFractionFont ? '0.9em' : undefined }}>
        {result.slice(indexOfDecimal + 1, result.length)}
      </span>
    </FullAmountTippy>
  );
};

interface MoneyWithFormatProps extends MoneyAnyFormatPropsBase {
  result: string;
  indexOfDecimal: number;
  isFiat?: boolean;
}

const MoneyWithFormat: FC<MoneyWithFormatProps> = ({
  tooltip,
  bn,
  className,
  result,
  indexOfDecimal,
  isFiat,
  smallFractionFont,
  withSign,
  tooltipPlacement,
  testID,
  testIDProperties
}) => {
  const fullAmount = useMemo(() => {
    if (!isFiat) return bn;

    const { amount } = formatAmount(bn);

    return new BigNumber(amount.toFixed(2));
  }, [bn.toString(), isFiat]);

  return (
    <FullAmountTippy
      enabled={tooltip}
      fullAmount={fullAmount}
      className={className}
      tooltipPlacement={tooltipPlacement}
      testID={testID}
      testIDProperties={testIDProperties}
    >
      {withSign && bn.isPositive() && '+'}
      {result.slice(0, indexOfDecimal + 1)}
      <span style={{ fontSize: smallFractionFont ? '0.9em' : undefined }}>
        {result.slice(indexOfDecimal + 1, result.length)}
      </span>
    </FullAmountTippy>
  );
};

interface FullAmountTippyProps extends HTMLAttributes<HTMLSpanElement>, TestIDProps {
  fullAmount: BigNumber;
  showAmountTooltip?: boolean;
  tooltipPlacement?: Placement;
  enabled?: boolean;
}

const FullAmountTippy: FC<FullAmountTippyProps> = ({
  fullAmount,
  onClick,
  showAmountTooltip,
  tooltipPlacement = 'top',
  enabled = true,
  testID,
  testIDProperties,
  ...rest
}) => {
  const fullAmountStr = useMemo(() => toLocalFixed(fullAmount), [fullAmount]);
  const { fieldRef, copy } = useCopyToClipboard();

  const tippyProps = useMemo<UseTippyOptions>(
    () => ({
      trigger: 'mouseenter',
      hideOnClick: true,
      content: fullAmountStr,
      animation: 'shift-away-subtle',
      placement: tooltipPlacement
    }),
    [fullAmountStr, tooltipPlacement]
  );

  const ref = useTippy<HTMLSpanElement>(tippyProps);

  const { trackEvent } = useAnalytics();

  const handleClick = useCallback(
    (evt: React.MouseEvent<HTMLSpanElement>) => {
      evt.preventDefault();
      evt.stopPropagation();

      copy();
      toastSuccess(t('copiedHash'));

      testID && trackEvent(testID, AnalyticsEventCategory.ButtonPress, testIDProperties);

      onClick?.(evt);
    },
    [copy, onClick, trackEvent, testID, testIDProperties]
  );

  return (
    <div className="contents" {...setTestID(testID)}>
      {enabled ? (
        <>
          <span ref={showAmountTooltip ? ref : undefined} onClick={handleClick} {...rest} />
          <input ref={fieldRef} value={fullAmountStr} readOnly className="sr-only" />
        </>
      ) : (
        <span {...rest} />
      )}
    </div>
  );
};
