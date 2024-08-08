import { mockPersistedState } from 'lib/store';

import { EvmLoadingStateInterface } from './state';

export const mockEvmLoadingState = mockPersistedState<EvmLoadingStateInterface>({
  balancesLoading: false,
  tokensMetadataLoading: false,
  collectiblesMetadataLoading: false,
  tokensExchangeRatesLoading: false
});
