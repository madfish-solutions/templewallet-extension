import { createAction } from '@reduxjs/toolkit';

import { createActions } from 'lib/store';

import { TokenMetadataInterface } from './utils';

export const addTokensMetadataAction = createAction<TokenMetadataInterface[]>('assets/ADD_TOKENS_METADATA');

export const loadTokensMetadataAction = createAction<string[]>('assets/LOAD_TOKENS_METADATA');

export const loadWhitelistAction = createActions<{ selectedRpcUrl: string }, Array<TokenMetadataInterface>>(
  'assets/LOAD_WHITELIST_METADATA'
);

export const loadTokenMetadataActions = createActions<
  Pick<TokenMetadataInterface, 'id' | 'address'>,
  TokenMetadataInterface,
  string
>('assets/LOAD_TOKEN_METADATA');

export const loadTokenSuggestionActions = createActions<
  Pick<TokenMetadataInterface, 'id' | 'address'>,
  TokenMetadataInterface,
  string
>('assets/LOAD_TOKEN_SUGGESTION');
