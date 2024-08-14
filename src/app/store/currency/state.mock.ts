import { createEntity, mockPersistedState } from 'lib/store';

import { CurrencyState } from './state';

export const mockCurrencyState = mockPersistedState<CurrencyState>({
  usdToTokenRates: createEntity({}),
  fiatToTezosRates: createEntity({}),
  btcToUsdRate: createEntity(null)
});
