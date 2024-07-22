import { createEntity } from 'lib/store';

import { CurrencyState } from './state';

export const mockCurrencyState: CurrencyState = {
  usdToTokenRates: createEntity({}),
  fiatToTezosRates: createEntity({}),
  btcToUsdRate: createEntity(null)
};
