import { mockPersistedState } from 'lib/store';

import { EvmTokensMetadataState } from './state';

export const mockEvmTokensMetadataState = mockPersistedState<EvmTokensMetadataState>({
  metadataRecord: {}
});
