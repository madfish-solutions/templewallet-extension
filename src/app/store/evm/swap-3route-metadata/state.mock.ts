import { mockPersistedState } from 'lib/store';
import { ETHERLINK_MAINNET_CHAIN_ID } from 'lib/temple/types';

import { Route3EvmTokensMetadataState } from './state';

export const mockRoute3EvmTokensMetadataState = mockPersistedState<Route3EvmTokensMetadataState>({
  metadataRecord: {},
  supportedChainIds: [ETHERLINK_MAINNET_CHAIN_ID],
  lastFetchTime: undefined,
  isLoading: false,
  error: null
});
