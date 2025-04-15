import { useMemo } from 'react';

import { useAllEvmChainsBalancesLoadingStatesSelector } from 'app/store/evm/selectors';

export const useEvmBalancesAreLoading = () => {
  const loadingStates = useAllEvmChainsBalancesLoadingStatesSelector();

  return useMemo(
    () => Object.values(loadingStates).some(({ api, onchain }) => api.isLoading || onchain.isLoading),
    [loadingStates]
  );
};
