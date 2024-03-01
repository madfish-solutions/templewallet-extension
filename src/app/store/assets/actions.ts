import { createAction } from '@reduxjs/toolkit';

import { WhitelistResponseToken } from 'lib/apis/temple';
import { TzktApiChainId } from 'lib/apis/tzkt';
import { createActions } from 'lib/store';

import type { AccountAssetForStore, StoredAsset } from './state';

interface LoadAssetsPayload {
  /** PKH */
  account: string;
  chainId: TzktApiChainId;
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

export const loadTokensScamlistActions = createActions<void, Record<string, boolean>, { code?: string }>(
  'assets/LOAD_TOKENS_SCAMLIST'
);

type SetAssetStatusPayload = AccountAssetForStore;

export const setTokenStatusAction = createAction<SetAssetStatusPayload>('assets/SET_TOKEN_STATUS');

export const setCollectibleStatusAction = createAction<SetAssetStatusPayload>('assets/SET_COLLECTIBLE_STATUS');

export type AssetToPut = AccountAssetForStore & StoredAsset;

export const putTokensAsIsAction = createAction<AssetToPut[]>('assets/PUT_TOKENS_AS_IS');

export const putCollectiblesAsIsAction = createAction<AssetToPut[]>('assets/PUT_COLLECTIBLES_AS_IS');
