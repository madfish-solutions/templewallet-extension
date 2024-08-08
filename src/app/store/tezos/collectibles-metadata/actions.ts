import { createAction } from '@reduxjs/toolkit';

import type { FetchedMetadataRecord } from 'lib/metadata/fetch';

export const putCollectiblesMetadataAction = createAction<{
  records: FetchedMetadataRecord;
  resetLoading?: boolean;
}>('collectibles-metadata/PUT_MULTIPLE');

export const loadCollectiblesMetadataAction = createAction<{
  rpcUrl: string;
  slugs: string[];
}>('collectibles-metadata/LOAD');

export const resetCollectiblesMetadataLoadingAction = createAction('collectibles-metadata/RESET_LOADING');
