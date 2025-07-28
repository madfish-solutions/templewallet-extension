import { useCallback } from 'react';

import BigNumber from 'bignumber.js';

import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { ZERO } from 'lib/utils/numbers';

export const useIsBigBalance = (
  getBalance: SyncFn<string, BigNumber | undefined>,
  getUsdToTokenRate: SyncFn<string, BigNumber.Value | undefined>
) => {
  const testnetModeEnabled = useTestnetModeEnabledSelector();

  return useCallback(
    (slug: string) => testnetModeEnabled || (getBalance(slug) ?? ZERO).times(getUsdToTokenRate(slug) ?? ZERO).gte(1),
    [getBalance, testnetModeEnabled, getUsdToTokenRate]
  );
};
