import { createAction } from '@reduxjs/toolkit';

import { WhitelistResponseToken } from 'lib/apis/temple';
import { TzktApiChainId } from 'lib/apis/tzkt';
import { createActions } from 'lib/store';

import type { TezosAccountAssetForStore, StoredTezosAsset } from './state';

interface LoadAssetsPayload {
  /** PKH */
  account: string;
  chainId: TzktApiChainId;
}

export const loadTokensWhitelistActions = createActions<void, WhitelistResponseToken[], { code?: string }>(
  'assets/LOAD_TOKENS_WHITELIST'
);

export const loadTokensScamlistActions = createActions<void, Record<string, boolean>, { code?: string }>(
  'assets/LOAD_TOKENS_SCAMLIST'
);

export const setAssetsIsLoadingAction = createAction<{
  type: 'tokens' | 'collectibles';
  value: boolean;
  resetError?: true;
}>('assets/SET_ASSETS_IS_LOADING');

type SetAssetStatusPayload = TezosAccountAssetForStore;

export const setTezosTokenStatusAction = createAction<SetAssetStatusPayload>('assets/SET_TOKEN_STATUS');

export const setTezosCollectibleStatusAction = createAction<SetAssetStatusPayload>('assets/SET_COLLECTIBLE_STATUS');

export type AssetToPut = TezosAccountAssetForStore & StoredTezosAsset;

export const addAccountTokensAction = createAction<LoadAssetsPayload & { slugs: string[] }>(
  'assets/ADD_ACCOUNT_TOKENS'
);
export const addAccountCollectiblesAction = createAction<LoadAssetsPayload & { slugs: string[] }>(
  'assets/ADD_ACCOUNT_COLLECTIBLES'
);

export const putTokensAsIsAction = createAction<AssetToPut[]>('assets/PUT_TOKENS_AS_IS');

export const putCollectiblesAsIsAction = createAction<AssetToPut[]>('assets/PUT_COLLECTIBLES_AS_IS');
