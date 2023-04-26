import { createAction } from '@reduxjs/toolkit';

import { TokenMetadata } from 'lib/metadata';
import { createActions } from 'lib/store';

export const addTokensMetadataAction = createAction<TokenMetadata[]>('assets/ADD_TOKENS_METADATA');

export const loadTokensMetadataAction = createAction<string[]>('assets/LOAD_TOKENS_METADATA');

export const loadWhitelistAction = createActions<{ selectedRpcUrl: string }, Array<TokenMetadata>>(
  'assets/LOAD_WHITELIST_METADATA'
);

export const loadTokenMetadataActions = createActions<Pick<TokenMetadata, 'id' | 'address'>, TokenMetadata, string>(
  'assets/LOAD_TOKEN_METADATA'
);

export const loadTokenSuggestionActions = createActions<Pick<TokenMetadata, 'id' | 'address'>, TokenMetadata, string>(
  'assets/LOAD_TOKEN_SUGGESTION'
);
