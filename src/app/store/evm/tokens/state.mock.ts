import { mockPersistedState } from 'lib/store';

import { EvmTokensStateInterface } from './state';

export const mockEvmTokensState = mockPersistedState<EvmTokensStateInterface>({
  record: {}
});
