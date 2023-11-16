import { mockPersistedState } from 'lib/store';

import type { SliceState } from './state';

export const mockCollectiblesMetadataState = mockPersistedState<SliceState>({
  records: new Map(),
  isLoading: false
});
