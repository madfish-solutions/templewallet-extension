import { useSelector } from '../root-state.selector';

export const useEvmBalancesLoadingStateRecordSelector = () =>
  useSelector(state => state.evm.balancesLoadingStateRecord);
