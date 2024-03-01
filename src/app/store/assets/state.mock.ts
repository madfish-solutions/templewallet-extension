import { createEntity, mockPersistedState } from 'lib/store';

import { SliceState } from './state';

export const mockAssetsState = mockPersistedState<SliceState>({
  tokens: createEntity({}),
  collectibles: createEntity({}),
  mainnetWhitelist: createEntity([]),
  mainnetScamlist: createEntity({})
});
