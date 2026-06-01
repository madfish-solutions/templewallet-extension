import { useMemo } from 'react';

import { useTezUsdToTokenRateSelector } from 'app/store/currency/selectors';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { mutezToTz } from 'lib/temple/helpers';
import { ZERO } from 'lib/utils/numbers';
import { useTezosMainnetChain } from 'temple/front';

import { useStakedAmount } from '../use-baking-hooks';

export const useTezosStakingSummand = (publicKeyHash: string, includeStaking: boolean) => {
  const isTestnetMode = useTestnetModeEnabledSelector();
  const tezosMainnet = useTezosMainnetChain();
  const { data: mainnetStakedAtomic } = useStakedAmount(tezosMainnet, publicKeyHash, false);
  const tezRate = useTezUsdToTokenRateSelector();

  return useMemo(
    () =>
      mainnetStakedAtomic && includeStaking && !isTestnetMode && tezRate
        ? mutezToTz(mainnetStakedAtomic).times(tezRate)
        : ZERO,
    [mainnetStakedAtomic, includeStaking, isTestnetMode, tezRate]
  );
};
