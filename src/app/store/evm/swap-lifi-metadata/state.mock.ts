import { mockPersistedState } from 'lib/store';

import { LifiEvmTokensMetadataState } from './state';

export const mockLifiEvmTokensMetadataState = mockPersistedState<LifiEvmTokensMetadataState>({
  metadataRecord: {},
  supportedChainIds: [],
  lastFetchTime: undefined,
  isLoading: false,
  error: null
});
