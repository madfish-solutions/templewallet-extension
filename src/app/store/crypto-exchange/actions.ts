import { createActions } from 'lib/store';

import { StoredExolixCurrency } from './state';

export const loadExolixCurrenciesActions = createActions<void, Array<StoredExolixCurrency>, string>(
  'crypto-exchange/LOAD_EXOLIX_CURRENCIES'
);
