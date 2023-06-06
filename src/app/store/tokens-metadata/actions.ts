import { createAction } from '@reduxjs/toolkit';

import type { TokenMetadata } from 'lib/metadata';
import { createActions } from 'lib/store';

export const addTokensMetadataAction = createAction<TokenMetadata[]>('assets/ADD_TOKENS_METADATA');

export const loadTokensMetadataAction = createAction<{ rpcUrl: string; slugs: string[] }>(
  'assets/LOAD_TOKENS_METADATA'
);

export const loadWhitelistAction = createActions<undefined, TokenMetadata[]>('assets/LOAD_WHITELIST_METADATA');

interface LoadTokenMetadataPayload extends Pick<TokenMetadata, 'id' | 'address'> {
  rpcUrl: string;
}

export const loadOneTokenMetadataActions = createActions<LoadTokenMetadataPayload, TokenMetadata, string>(
  'assets/LOAD_TOKEN_METADATA'
);

export const loadTokenSuggestionActions = createActions<LoadTokenMetadataPayload, TokenMetadata, string>(
  'assets/LOAD_TOKEN_SUGGESTION'
);

export const resetTokensMetadataLoadingAction = createAction('assets/RESET_TOKENS_METADATA_LOADING');
