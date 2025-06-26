import { isDefined } from '@rnw-community/shared';
import BigNumber from 'bignumber.js';

import { isTruthy } from 'lib/utils';
import { ZERO } from 'lib/utils/numbers';

export const calculateTotalDollarValue = (
  assetSlugs: string[],
  getBalance: (slug: string) => BigNumber | undefined,
  getUsdToTokenRate: (slug: string) => string | number | undefined
) => {
  let dollarValue = ZERO;

  for (const assetSlug of assetSlugs) {
    const balance = getBalance(assetSlug);
    const usdToTokenRate = getUsdToTokenRate(assetSlug);
    const tokenDollarValue = isDefined(balance) && isTruthy(usdToTokenRate) ? balance.times(usdToTokenRate) : ZERO;
    dollarValue = dollarValue.plus(tokenDollarValue);
  }

  return dollarValue.toString();
};
