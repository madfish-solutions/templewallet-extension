import { useSelector } from '..';

export const useBalancesSelector = () => useSelector(state => state.balances.balancesAtomic);
