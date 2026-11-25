import { isDefined } from '@rnw-community/shared';
import BigNumber from 'bignumber.js';

import { atomsToTokens } from 'lib/temple/helpers';
import { isTruthy } from 'lib/utils';
import { ZERO } from 'lib/utils/numbers';

/**
 * Raw balance must be the store value itself.
 * Ref-backed getters stay referentially stable, so these totals otherwise refresh only when prices change.
 */
export const tokenBalanceFromRaw = (rawBalance: string | undefined, metadata: { decimals?: number } | undefined) =>
  rawBalance && isDefined(metadata?.decimals) ? atomsToTokens(rawBalance, metadata.decimals) : undefined;

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

  return dollarValue;
};
