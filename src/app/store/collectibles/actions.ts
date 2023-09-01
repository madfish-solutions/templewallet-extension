import { createActions } from 'lib/store';

import type { CollectibleDetailsRecord } from './state';

export const loadCollectiblesDetailsActions = createActions<
  string[],
  {
    details: CollectibleDetailsRecord;
    /** In milliseconds */
    timestamp: number;
  },
  string
>('collectibles/DETAILS');
