import { createAction } from '@reduxjs/toolkit';

import type { TokenMetadata } from 'lib/metadata';
import { createActions } from 'lib/store';

export const addTokensMetadataAction = createAction<TokenMetadata[]>('metadata/ADD_TOKENS_METADATA');

export const loadTokensMetadataAction = createAction<{
  rpcUrl: string;
  slugs: string[];
}>('metadata/LOAD_TOKENS_METADATA');

export const loadWhitelistAction = createActions<undefined, TokenMetadata[]>('metadata/LOAD_WHITELIST_METADATA');

interface LoadTokenMetadataPayload extends Pick<TokenMetadata, 'id' | 'address'> {
  rpcUrl: string;
}

export const loadOneTokenMetadataActions = createActions<LoadTokenMetadataPayload, TokenMetadata, string>(
  'metadata/LOAD_TOKEN_METADATA'
);

export const loadTokenSuggestionActions = createActions<LoadTokenMetadataPayload, TokenMetadata, string>(
  'metadata/LOAD_TOKEN_SUGGESTION'
);

export const resetTokensMetadataLoadingAction = createAction('metadata/RESET_TOKENS_METADATA_LOADING');

export const refreshTokensMetadataAction = createAction<TokenMetadata[]>('metadata/REFRESH_TOKENS_METADATA');
