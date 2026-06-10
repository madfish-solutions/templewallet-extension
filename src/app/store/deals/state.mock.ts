import { mockPersistedState } from 'lib/store';

import type { DealsState } from './state';

export const mockDealsState = mockPersistedState<DealsState>({
  enabled: false,
  snoozedUntil: 0
});
