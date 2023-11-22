import { createAction } from '@reduxjs/toolkit';

import { WhitelistResponseToken } from 'lib/apis/temple';
import { createActions } from 'lib/store';

import { AccountAssetForStore, StoredToken, StoredCollectible } from './state';

interface LoadAssetsPayload {
  /** PKH */
  account: string;
  chainId: string;
}

export const loadAccountTokensActions = createActions<
  LoadAssetsPayload,
  LoadAssetsPayload & { slugs: string[] },
  { code?: string }
>('assets/LOAD_ACCOUNT_TOKENS');

export const loadAccountCollectiblesActions = createActions<
  LoadAssetsPayload,
  LoadAssetsPayload & { slugs: string[] },
  { code?: string }
>('assets/LOAD_ACCOUNT_COLLECTIBLES');

export const loadTokensWhitelistActions = createActions<void, WhitelistResponseToken[], { code?: string }>(
  'assets/LOAD_TOKENS_WHITELIST'
);

type SetAssetStatusPayload = AccountAssetForStore;

export const setTokenStatusAction = createAction<SetAssetStatusPayload>('assets/SET_TOKEN_STATUS');

export const setCollectibleStatusAction = createAction<SetAssetStatusPayload>('assets/SET_COLLECTIBLE_STATUS');

export type TokenToPut = StoredToken;
export const putTokensAsIsAction = createAction<TokenToPut[]>('assets/PUT_TOKENS_AS_IS');

export type CollectibleToPut = AccountAssetForStore & StoredCollectible;
export const putCollectiblesAsIsAction = createAction<CollectibleToPut[]>('assets/PUT_COLLECTIBLES_AS_IS');
