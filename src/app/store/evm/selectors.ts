import { useSelector } from '../root-state.selector';

export const useEvmLoadingStateRecordSelector = () => useSelector(state => state.evm.loadingStateRecord);
