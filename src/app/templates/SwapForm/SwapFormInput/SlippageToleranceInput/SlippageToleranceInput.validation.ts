import BigNumber from 'bignumber.js';

import { t } from 'lib/i18n';

export const MAX_SLIPPAGE_TOLERANCE_PERCENT = 30;

export const slippageToleranceInputValidationFn = (v?: number): string | true => {
  if (v === undefined) {
    return '';
  }

  if (v < 0) {
    return t('mustBeNonNegative');
  }
  const vBN = new BigNumber(v);

  return (
    vBN.isLessThanOrEqualTo(MAX_SLIPPAGE_TOLERANCE_PERCENT) ||
    t('maximalAmount', [String(MAX_SLIPPAGE_TOLERANCE_PERCENT)])
  );
};
