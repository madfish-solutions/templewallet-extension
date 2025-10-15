import { createAction } from '@reduxjs/toolkit';

import type { FetchedMetadataRecord } from 'lib/metadata/fetch';
import { TezosNetworkEssentials } from 'temple/networks';

export const putCollectiblesMetadataAction = createAction<{
  records: FetchedMetadataRecord;
  resetLoading?: boolean;
}>('collectibles-metadata/PUT_MULTIPLE');

export const loadCollectiblesMetadataAction = createAction<{
  network: TezosNetworkEssentials;
  slugs: string[];
}>('collectibles-metadata/LOAD');

export const resetCollectiblesMetadataLoadingAction = createAction('collectibles-metadata/RESET_LOADING');
