import { useSelector } from '../root-state.selector';

export const useEvmBalancesLoadingSelector = () => useSelector(state => state.evmLoading.balancesLoading);

export const useEvmTokensMetadataLoadingSelector = () => useSelector(state => state.evmLoading.tokensMetadataLoading);

export const useEvmCollectiblesMetadataLoadingSelector = () =>
  useSelector(state => state.evmLoading.collectiblesMetadataLoading);

export const useEvmTokensExchangeRatesLoadingSelector = () =>
  useSelector(state => state.evmLoading.tokensExchangeRatesLoading);
