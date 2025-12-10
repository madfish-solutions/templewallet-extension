import { mockPersistedState } from 'lib/store';

import { PendingTezosTransactionsState } from './state';

export const mockPendingTezosTransactionsState = mockPersistedState<PendingTezosTransactionsState>({
  transactions: {},
  hashesByAccountChainId: {}
});
