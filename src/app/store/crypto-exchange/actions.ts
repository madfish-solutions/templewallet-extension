import { createActions } from 'lib/store';

import { ExolixNetworksMap, StoredExolixCurrency } from './state';

export const loadExolixCurrenciesActions = createActions<void, Array<StoredExolixCurrency>, string>(
  'crypto-exchange/LOAD_EXOLIX_CURRENCIES'
);

export const loadExolixNetworksMapActions = createActions<void, ExolixNetworksMap, string>(
  'crypto-exchange/LOAD_EXOLIX_NETWORKS_MAP'
);
