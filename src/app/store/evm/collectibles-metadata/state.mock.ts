import { mockPersistedState } from 'lib/store';

import { EvmCollectiblesMetadataState } from './state';

export const mockEvmCollectiblesMetadataState = mockPersistedState<EvmCollectiblesMetadataState>({
  metadataRecord: {}
});
