import { createAction } from '@reduxjs/toolkit';

import { TokenMetadataResponse } from 'lib/apis/temple';
import type { TokenMetadata } from 'lib/metadata';

export const addCollectiblesMetadataAction = createAction<TokenMetadata[]>('collectibles-metadata/ADD_MULTIPLE');

export const addCollectiblesMetadataOfFetchedAction = createAction<Record<string, TokenMetadataResponse>>(
  'collectibles-metadata/ADD_MULTIPLE_OF_FETCHED'
);

export const putCollectiblesMetadataAction = createAction<TokenMetadata[]>('collectibles-metadata/PUT_MULTIPLE');

export const loadCollectiblesMetadataAction = createAction<{
  rpcUrl: string;
  slugs: string[];
}>('collectibles-metadata/LOAD');

export const resetCollectiblesMetadataLoadingAction = createAction('collectibles-metadata/RESET_LOADING');

export const refreshCollectiblesMetadataAction = createAction<TokenMetadata[]>('collectibles-metadata/REFRESH');
