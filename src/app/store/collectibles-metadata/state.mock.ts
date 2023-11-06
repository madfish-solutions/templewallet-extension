import { mockPersistedState } from 'lib/store';

import type { CollectiblesMetadataState } from './state';

export const mockCollectiblesMetadataState = mockPersistedState<CollectiblesMetadataState>({
  records: [],
  isLoading: false
});
