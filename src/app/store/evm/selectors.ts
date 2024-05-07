import { useSelector } from '../root-state.selector';

export const useEvmBalancesLoadingStateRecordSelector = () =>
  useSelector(state => state.evm.balancesLoadingStateRecord);

export const useEvmCollectiblesMetadataLoadingStateRecordSelector = () =>
  useSelector(state => state.evm.collectiblesMetadataLoadingStateRecord);
