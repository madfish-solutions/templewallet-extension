import { createAction } from '@reduxjs/toolkit';

import { TokenMetadataResponse } from 'lib/apis/temple';
import type { TokenMetadata } from 'lib/metadata';

export const putTokensMetadataAction = createAction<TokenMetadata[]>('metadata/PUT_TOKENS_METADATA');

export const addTokensMetadataAction = createAction<TokenMetadata[]>('metadata/ADD_TOKENS_METADATA');

export const addTokensMetadataOfFetchedAction = createAction<Record<string, TokenMetadataResponse>>(
  'metadata/ADD_TOKENS_METADATA_OF_FETCHED'
);

export const loadTokensMetadataAction = createAction<{
  rpcUrl: string;
  slugs: string[];
}>('metadata/LOAD_TOKENS_METADATA');

export const resetTokensMetadataLoadingAction = createAction('metadata/RESET_TOKENS_METADATA_LOADING');

export const refreshTokensMetadataAction = createAction<TokenMetadata[]>('metadata/REFRESH_TOKENS_METADATA');
