import { createEntity, mockPersistedState } from 'lib/store';

import { CryptoExchangeState } from './state';

export const mockCryptoExchangeState = mockPersistedState<CryptoExchangeState>({
  exolixCurrencies: createEntity([]),
  exolixNetworksMap: createEntity({})
});
