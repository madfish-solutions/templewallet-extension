import { createAction } from '@reduxjs/toolkit';

import { TokenMetadataResponse } from 'lib/apis/temple';
import type { TokenMetadata } from 'lib/metadata';

export const addTokensMetadataAction = createAction<TokenMetadata[]>('tokens-metadata/ADD_MULTIPLE');

export const addTokensMetadataOfFetchedAction = createAction<Record<string, TokenMetadataResponse>>(
  'tokens-metadata/ADD_MULTIPLE_OF_FETCHED'
);

export const putTokensMetadataAction = createAction<TokenMetadata[]>('tokens-metadata/PUT_MULTIPLE');

export const loadTokensMetadataAction = createAction<{
  rpcUrl: string;
  slugs: string[];
}>('tokens-metadata/LOAD');

export const resetTokensMetadataLoadingAction = createAction('tokens-metadata/RESET_LOADING');

export const refreshTokensMetadataAction = createAction<TokenMetadata[]>('tokens-metadata/REFRESH_MULTIPLE');
