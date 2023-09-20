import { createEntity } from 'lib/store';

import { SliceState } from './state';

export const mockAssetsState: SliceState = {
  tokens: createEntity([]),
  mainnetWhitelist: createEntity([])
};
