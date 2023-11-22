import { createAction } from '@reduxjs/toolkit';

import { WhitelistResponseToken } from 'lib/apis/temple';
import { createActions } from 'lib/store';

import { StoredAssetStatus, StoredAsset, StoredCollectible, StoredToken } from './state';

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

interface SetAssetStatusPayload extends Pick<StoredAsset, 'account' | 'chainId' | 'slug'> {
  status: StoredAssetStatus;
}

export const setTokenStatusAction = createAction<SetAssetStatusPayload>('assets/SET_TOKEN_STATUS');

export const setCollectibleStatusAction = createAction<SetAssetStatusPayload>('assets/SET_COLLECTIBLE_STATUS');

export const putTokensAsIsAction = createAction<StoredToken[]>('assets/PUT_TOKENS_AS_IS');

export const putCollectiblesAsIsAction = createAction<StoredCollectible[]>('assets/PUT_COLLECTIBLES_AS_IS');
