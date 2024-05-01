import { mockPersistedState } from 'lib/store';

import { EvmCollectiblesStateInterface } from './state';

export const mockEvmCollectiblesState = mockPersistedState<EvmCollectiblesStateInterface>({
  record: {}
});
