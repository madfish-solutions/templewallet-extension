import { createAction } from '@reduxjs/toolkit';
import { TezosToolkit } from '@taquito/taquito';

import { TokenMetadata } from 'lib/metadata';
import { createActions } from 'lib/store';

export const addTokensMetadataAction = createAction<TokenMetadata[]>('assets/ADD_TOKENS_METADATA');

export const loadTokensMetadataAction = createAction<{ tezos: TezosToolkit; slugs: string[] }>(
  'assets/LOAD_TOKENS_METADATA'
);

export const loadWhitelistAction = createActions<{ selectedRpcUrl: string }, Array<TokenMetadata>>(
  'assets/LOAD_WHITELIST_METADATA'
);

interface LoadTokenMetadataPayload extends Pick<TokenMetadata, 'id' | 'address'> {
  tezos: TezosToolkit;
}

export const loadTokenMetadataActions = createActions<LoadTokenMetadataPayload, TokenMetadata, string>(
  'assets/LOAD_TOKEN_METADATA'
);

export const loadTokenSuggestionActions = createActions<LoadTokenMetadataPayload, TokenMetadata, string>(
  'assets/LOAD_TOKEN_SUGGESTION'
);
