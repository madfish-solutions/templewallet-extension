import { mockPersistedState } from 'lib/store';

import { EvmAssetsStateInterface } from './state';

export const mockEvmAssetsState = mockPersistedState<EvmAssetsStateInterface>({
  tokens: {},
  collectibles: {}
});
