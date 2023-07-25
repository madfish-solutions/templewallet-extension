import { createActions } from 'lib/store';

import type { CollectibleDetailsRecord } from './state';

export const loadCollectiblesDetailsActions = createActions<string[], CollectibleDetailsRecord, string>(
  'collectibles/DETAILS'
);
