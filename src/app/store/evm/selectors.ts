import { useSelector } from '../root-state.selector';

export const useEvmDataLoadingSelector = () => useSelector(state => state.evm.isDataLoading);
