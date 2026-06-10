import { FC, MouseEvent } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import { toastSuccess } from 'app/toaster';
import { t, toLocalFormat } from 'lib/i18n';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';
import useTippy from 'lib/ui/useTippy';

interface BalanceAmountProps {
  value: BigNumber.Value;
  decimalPlaces?: number;
  lessThanThreshold?: number;
  className?: string;
}

export const BalanceAmount: FC<BalanceAmountProps> = ({ value, decimalPlaces = 2, lessThanThreshold, className }) => {
  const bn = new BigNumber(value);
  const isPositive = bn.isGreaterThan(0);
  const belowThreshold = lessThanThreshold !== undefined && isPositive && bn.isLessThan(lessThanThreshold);
  const display = belowThreshold ? `<${lessThanThreshold}` : toLocalFormat(bn, { decimalPlaces });

  const sourceDecimals = bn.decimalPlaces() ?? 0;
  const hasHiddenPrecision = sourceDecimals > decimalPlaces || belowThreshold;
  const showTippy = isPositive && hasHiddenPrecision;
  const tippyContent = toLocalFormat(bn, { decimalPlaces: Math.max(sourceDecimals, decimalPlaces) });

  const tippyRef = useTippy<HTMLSpanElement>({
    trigger: 'mouseenter',
    hideOnClick: false,
    content: tippyContent,
    animation: 'shift-away-subtle',
    placement: 'top' as const
  });

  const { fieldRef, copy } = useCopyToClipboard();
  const handleClick = (evt: MouseEvent<HTMLSpanElement>) => {
    if (!isPositive) return;
    evt.preventDefault();
    evt.stopPropagation();
    copy();
    toastSuccess(t('copiedHash'));
  };

  return (
    <>
      <span
        ref={showTippy ? tippyRef : undefined}
        onClick={handleClick}
        className={clsx(isPositive && 'rounded-sm cursor-pointer hover:bg-black/5 transition px-px -mx-px', className)}
      >
        {display}
      </span>
      {isPositive && <input ref={fieldRef} value={bn.toFixed()} readOnly className="sr-only" />}
    </>
  );
};
