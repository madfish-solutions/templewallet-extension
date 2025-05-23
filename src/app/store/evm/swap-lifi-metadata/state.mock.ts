import { mockPersistedState } from 'lib/store';

import { LifiEvmTokensMetadataState } from './state';

export const mockLifiEvmTokensMetadataState = mockPersistedState<LifiEvmTokensMetadataState>({
  metadataRecord: {},
  isLoading: false,
  error: null
});
