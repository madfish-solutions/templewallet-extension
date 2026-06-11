import { useMemo } from 'react';

import { useEthUsdToTokenRateSelector } from 'app/store/evm/tokens-exchange-rates/selectors';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { ETHEREUM_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useEthStakingDeposit } from 'lib/utils/eth-staking';
import { ZERO } from 'lib/utils/numbers';

export const useEthStakingSummand = (publicKeyHash: HexString, includeStaking: boolean) => {
  const isTestnetMode = useTestnetModeEnabledSelector();
  const deposit = useEthStakingDeposit(publicKeyHash, ETHEREUM_MAINNET_CHAIN_ID);
  const ethExchangeRate = useEthUsdToTokenRateSelector();

  return useMemo(
    () =>
      deposit && includeStaking && !isTestnetMode && ethExchangeRate
        ? (deposit.amount ?? ZERO).times(ethExchangeRate)
        : ZERO,
    [deposit, includeStaking, isTestnetMode, ethExchangeRate]
  );
};
