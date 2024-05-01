import { useSelector } from '../../root-state.selector';

export const useEvmTokensBalancesAtomicRecordSelector = () =>
  useSelector(state => state.evmTokensBalances.balancesAtomic);
