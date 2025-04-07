import { useMemo } from 'react';

import { useSelector } from 'app/store/root-state.selector';
import { LoadableState } from 'lib/store/entity.utils';

export const useAllEvmChainsBalancesLoadingStatesSelector = () => useSelector(state => state.evmLoading.balances);

export const useEvmBalancesLoadingStateSelector = (chainId: number): LoadableState | undefined =>
  useSelector(state => state.evmLoading.balances[chainId]);

export const useEvmChainBalancesLoadingSelector = (chainId: number) =>
  useSelector(state => state.evmLoading.balances[chainId]?.isLoading ?? false);

export const useEvmTokensMetadataLoadingSelector = () => useSelector(state => state.evmLoading.tokensMetadataLoading);

export const useEvmCollectiblesMetadataLoadingSelector = () =>
  useSelector(state => state.evmLoading.collectiblesMetadataLoading);

export const useEvmChainsTokensExchangeRatesLoadingSelector = () =>
  useSelector(state => state.evmLoading.chainsTokensExchangeRatesLoading);

export const useEvmTokensExchangeRatesLoading = () => {
  const chainsTokensExchangeRatesLoading = useEvmChainsTokensExchangeRatesLoadingSelector();

  return useMemo(
    () => !Object.values(chainsTokensExchangeRatesLoading).some(x => x),
    [chainsTokensExchangeRatesLoading]
  );
};
