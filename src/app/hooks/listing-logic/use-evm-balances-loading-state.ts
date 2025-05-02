import { useMemo } from 'react';

import { useAllEvmChainsBalancesLoadingStatesSelector } from 'app/store/evm/selectors';

export const useEvmBalancesAreLoading = () => {
  const loadingStates = useAllEvmChainsBalancesLoadingStatesSelector();

  return useMemo(() => {
    for (const assetSlug in loadingStates) {
      const { api, onchain } = loadingStates[assetSlug];
      if (api.isLoading || onchain.isLoading) {
        return true;
      }
    }

    return false;
  }, [loadingStates]);
};
