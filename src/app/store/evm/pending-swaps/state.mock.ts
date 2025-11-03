import { mockPersistedState } from 'lib/store';

import { PendingEvmSwapsState } from './state';

export const mockPendingEvmSwapsState = mockPersistedState<PendingEvmSwapsState>({
  swaps: {}
});
