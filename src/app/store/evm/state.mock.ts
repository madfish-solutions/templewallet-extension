import { mockPersistedState } from 'lib/store';

import { EvmLoadingStateInterface } from './state';

export const mockEvmLoadingState = mockPersistedState<EvmLoadingStateInterface>({
  balancesStates: {},
  tokensMetadataLoading: false,
  collectiblesMetadataLoading: false,
  chainsTokensExchangeRatesLoading: {}
});
