import { useEvmLoadingStateRecordSelector } from 'app/store/evm/selectors';

export const useEvmTokensDataLoadingState = (chainId: number) => {
  const loadingStateRecord = useEvmLoadingStateRecordSelector();

  return loadingStateRecord[chainId] ? loadingStateRecord[chainId].isLoading : false;
};
