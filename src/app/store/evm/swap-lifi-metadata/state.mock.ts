import { mockPersistedState } from 'lib/store';

import { LifiEvmTokensMetadataState } from './state';

export const mockLifiEvmTokensMetadataState = mockPersistedState<LifiEvmTokensMetadataState>({
  connectedTokensMetadataRecord: {},
  enabledChainsTokensMetadataRecord: {},
  supportedChainIds: [],
  catalogueFetchedAt: undefined,
  lastFetchTime: undefined,
  isLoading: false,
  error: null
});
