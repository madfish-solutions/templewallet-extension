import { useSelector } from 'app/store/root-state.selector';

export const usePendingEvmTransferStatusSelector = (txHash: HexString) => {
  return useSelector(state => state.pendingEvmTransactions?.transfers[txHash]?.status ?? 'DONE');
};
