import { useSelector } from '../root-state.selector';
import { getKeyForBalancesRecord } from './utils';

const EMPTY_BALANCES_RECORD = {};

export const useBalancesSelector = (publicKeyHash: string, chainId: string) => {
  const publicKeyHashWithChainId = getKeyForBalancesRecord(publicKeyHash, chainId);

  return useSelector(state => state.balances.balancesAtomic[publicKeyHashWithChainId]?.data ?? EMPTY_BALANCES_RECORD);
};
