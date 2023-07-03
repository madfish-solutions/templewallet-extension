import { createActions } from 'lib/store';

import { CollectibleDetailsRecord } from './state';

export const loadCollectiblesDetailsActions = createActions<string, CollectibleDetailsRecord, string>(
  'collectibles/DETAILS'
);
