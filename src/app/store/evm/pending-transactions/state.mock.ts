import { mockPersistedState } from 'lib/store';

import { PendingEvmTransactionsState } from './state';

export const mockPendingEvmTransactionsState = mockPersistedState<PendingEvmTransactionsState>({
  batches: {},
  transfers: {},
  swaps: {},
  otherTransactions: {}
});
