import { mockPersistedState } from 'lib/store';

import { PendingEvmTransactionsState } from './state';

export const mockPendingEvmSwapsState = mockPersistedState<PendingEvmTransactionsState>({
  transfers: {},
  swaps: {}
});
