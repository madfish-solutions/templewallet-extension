import { useMemo } from 'react';

import { useSelector } from 'app/store/root-state.selector';
import { RootState } from 'app/store/root-state.type';

export const selectAllPendingTezosTransactions = (state: RootState) =>
  Object.values(state.pendingTezosTransactions?.transactions ?? {});

export const toAccountChainIdSlug = (accountPkh: string, chainId: string) => `${accountPkh}-${chainId}`;

export const usePendingTezosTransactionsHashes = (accountPkh: string, chainId: string) => {
  const { hashesByAccountChainId, transactions } = useSelector(
    ({ pendingTezosTransactions }) => pendingTezosTransactions
  );

  return useMemo(
    () =>
      (hashesByAccountChainId[toAccountChainIdSlug(accountPkh, chainId)] ?? []).filter(
        hash => transactions[hash]?.status === 'PENDING'
      ),
    [hashesByAccountChainId, transactions, accountPkh, chainId]
  );
};

export const useHasPendingTezosDelegation = (accountPkh: string, chainId: string) => {
  const { hashesByAccountChainId, transactions } = useSelector(
    ({ pendingTezosTransactions }) => pendingTezosTransactions
  );

  return (hashesByAccountChainId[toAccountChainIdSlug(accountPkh, chainId)] ?? []).some(
    hash => transactions[hash]?.status === 'PENDING' && transactions[hash]?.kind === 'delegation'
  );
};
