import { mockPersistedState } from 'lib/store';

import { EvmTokensExchangeRateState } from './state';

export const mockEvmTokensExchangeRatesState = mockPersistedState<EvmTokensExchangeRateState>({
  usdToTokenRates: {},
  timestamps: {}
});
