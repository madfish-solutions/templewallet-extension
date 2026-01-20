import { useSelector } from 'app/store/root-state.selector';

export const usePendingTezosTransactionStatusSelector = (txHash: string) => {
  return useSelector(state => state.pendingTezosTransactions?.transactions[txHash]?.status);
};
