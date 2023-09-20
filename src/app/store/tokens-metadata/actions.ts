import { createAction } from '@reduxjs/toolkit';

import type { TokenMetadata } from 'lib/metadata';

export const putTokensMetadataAction = createAction<TokenMetadata[]>('metadata/PUT_TOKENS_METADATA');

export const addTokensMetadataAction = createAction<TokenMetadata[]>('metadata/ADD_TOKENS_METADATA');

export const loadTokensMetadataAction = createAction<{
  rpcUrl: string;
  slugs: string[];
}>('metadata/LOAD_TOKENS_METADATA');

export const resetTokensMetadataLoadingAction = createAction('metadata/RESET_TOKENS_METADATA_LOADING');

export const refreshTokensMetadataAction = createAction<TokenMetadata[]>('metadata/REFRESH_TOKENS_METADATA');
