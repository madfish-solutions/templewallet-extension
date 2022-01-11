import BigNumber from 'bignumber.js';

import { t } from 'lib/i18n/react';

const maxTolerancePercentage = 30;

export const slippageToleranceInputValidationFn = (v?: number) => {
  if (v === undefined) {
    return '';
  }

  if (v < 0) {
    return t('mustBeNonNegative');
  }
  const vBN = new BigNumber(v);

  return vBN.isLessThanOrEqualTo(maxTolerancePercentage) || t('maximalAmount', [maxTolerancePercentage]);
};
