import { mockPersistedState } from 'lib/store';

import { EvmStateInterface } from './state';

export const mockEvmState = mockPersistedState<EvmStateInterface>({
  balancesLoadingStateRecord: {},
  tokensMetadataLoadingStateRecord: {},
  collectiblesMetadataLoadingStateRecord: {}
});
