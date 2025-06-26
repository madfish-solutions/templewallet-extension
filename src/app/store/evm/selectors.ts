import { useMemo } from 'react';

import { useSelector } from 'app/store/root-state.selector';
import { LoadableState } from 'lib/store/entity.utils';

import { EvmBalancesSource } from './state';

export const useAllEvmChainsBalancesLoadingStatesSelector = () => useSelector(state => state.evmLoading.balancesStates);

export const useEvmBalancesLoadingStateSelector = (
  chainId: number,
  source: EvmBalancesSource
): LoadableState | undefined => useSelector(state => state.evmLoading.balancesStates[chainId]?.[source]);

export const useEvmChainBalancesLoadingSelector = (chainId: number, source?: EvmBalancesSource) =>
  useSelector(state => {
    const loadingState = state.evmLoading.balancesStates[chainId] ?? {
      api: { isLoading: false },
      onchain: { isLoading: false }
    };
    const { api: apiLoadingState, onchain: chainLoadingState } = loadingState;

    return source ? loadingState[source].isLoading : apiLoadingState.isLoading || chainLoadingState.isLoading;
  });

export const useEvmTokensMetadataLoadingSelector = () => useSelector(state => state.evmLoading.tokensMetadataLoading);

export const useEvmCollectiblesMetadataLoadingSelector = () =>
  useSelector(state => state.evmLoading.collectiblesMetadataLoading);

export const useEvmChainsTokensExchangeRatesLoadingSelector = () =>
  useSelector(state => state.evmLoading.chainsTokensExchangeRatesLoading);

export const useEvmTokensExchangeRatesLoading = () => {
  const chainsTokensExchangeRatesLoading = useEvmChainsTokensExchangeRatesLoadingSelector();

  return useMemo(() => {
    for (const chainId in chainsTokensExchangeRatesLoading) {
      if (chainsTokensExchangeRatesLoading[chainId]) {
        return true;
      }
    }

    return false;
  }, [chainsTokensExchangeRatesLoading]);
};
