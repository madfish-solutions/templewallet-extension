import { createEntity, mockPersistedState } from 'lib/store';

import type { CollectiblesState } from './state';

export const mockCollectiblesState = mockPersistedState<CollectiblesState>({
  details: createEntity({}),
  adultFlags: {}
});
