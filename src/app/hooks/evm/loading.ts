import {
  useEvmCollectiblesMetadataLoadingStateRecordSelector,
  useEvmTokensMetadataLoadingStateRecordSelector
} from 'app/store/evm/selectors';

export const useEvmTokensMetadataLoadingState = (chainId: number) => {
  const loadingStateRecord = useEvmTokensMetadataLoadingStateRecordSelector();

  return loadingStateRecord[chainId] ? loadingStateRecord[chainId].isLoading : false;
};

export const useEvmCollectiblesMetadataLoadingState = (chainId: number) => {
  const loadingStateRecord = useEvmCollectiblesMetadataLoadingStateRecordSelector();

  return loadingStateRecord[chainId] ? loadingStateRecord[chainId].isLoading : false;
};
