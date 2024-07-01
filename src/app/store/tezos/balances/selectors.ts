import { LoadableEntityState } from 'lib/store';
import { EMPTY_FROZEN_OBJ } from 'lib/utils';

import { useSelector } from '../../root-state.selector';

import { getKeyForBalancesRecord } from './utils';

export const useBalancesAtomicRecordSelector = () => useSelector(state => state.balances.balancesAtomic);

export const useAllAccountBalancesEntitySelector = (
  publicKeyHash: string,
  chainId: string
): LoadableEntityState<StringRecord> | undefined => {
  const publicKeyHashWithChainId = getKeyForBalancesRecord(publicKeyHash, chainId);

  return useSelector(state => state.balances.balancesAtomic[publicKeyHashWithChainId]);
};

export const useAllAccountBalancesSelector = (publicKeyHash: string, chainId: string) => {
  const publicKeyHashWithChainId = getKeyForBalancesRecord(publicKeyHash, chainId);

  return useSelector(state => state.balances.balancesAtomic[publicKeyHashWithChainId]?.data ?? EMPTY_FROZEN_OBJ);
};

export const useBalanceSelector = (publicKeyHash: string, chainId: string, assetSlug: string): string | undefined => {
  const publicKeyHashWithChainId = getKeyForBalancesRecord(publicKeyHash, chainId);

  return useSelector(state => state.balances.balancesAtomic[publicKeyHashWithChainId]?.data[assetSlug]);
};

export const useBalancesLoadingSelector = (publicKeyHash: string, chainId: string) => {
  const publicKeyHashWithChainId = getKeyForBalancesRecord(publicKeyHash, chainId);

  return useSelector(state => state.balances.balancesAtomic[publicKeyHashWithChainId]?.isLoading ?? false);
};

export const useBalancesErrorSelector = (publicKeyHash: string, chainId: string) => {
  const publicKeyHashWithChainId = getKeyForBalancesRecord(publicKeyHash, chainId);

  return useSelector(state => state.balances.balancesAtomic[publicKeyHashWithChainId]?.error);
};
