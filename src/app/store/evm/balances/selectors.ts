import { useSelector } from '../../root-state.selector';

export const useEvmBalancesAtomicRecordSelector = () => useSelector(state => state.evmBalances.balancesAtomic);
