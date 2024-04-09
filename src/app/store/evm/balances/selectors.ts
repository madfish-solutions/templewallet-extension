import { useSelector } from '../../root-state.selector';

export const useAllEVMBalancesSelector = () => useSelector(state => state.evmBalances.balancesAtomic);
