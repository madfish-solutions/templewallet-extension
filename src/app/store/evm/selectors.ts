import { useSelector } from '../root-state.selector';

export const useEvmBalancesLoadingSelector = () => useSelector(state => state.evm.balancesLoading);

export const useEvmTokensMetadataLoadingStateRecordSelector = () =>
  useSelector(state => state.evm.tokensMetadataLoadingStateRecord);

export const useEvmCollectiblesMetadataLoadingStateRecordSelector = () =>
  useSelector(state => state.evm.collectiblesMetadataLoadingStateRecord);
