import { mockPersistedState } from 'lib/store';

import { EVMAssetsStateInterface } from './state';

export const mockEVMAssetsState = mockPersistedState<EVMAssetsStateInterface>({
  tokens: {}
});
