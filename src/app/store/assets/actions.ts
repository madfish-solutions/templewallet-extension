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

export type LoadedCollectible = Pick<StoredCollectible, 'slug' | 'name' | 'symbol'>;

export const loadAccountCollectiblesActions = createActions<
  LoadAssetsPayload,
  LoadAssetsPayload & { collectibles: LoadedCollectible[] },
  { code?: string }
>('assets/LOAD_ACCOUNT_COLLECTIBLES');

type LoadWhitelistPayload = WhitelistResponseToken[];

export const loadTokensWhitelistActions = createActions<void, LoadWhitelistPayload, { code?: string }>(
  'assets/LOAD_TOKENS_WHITELIST'
);

interface SetAssetStatusPayload extends Pick<StoredAsset, 'account' | 'chainId' | 'slug'> {
  isCollectible?: boolean;
  status: StoredAssetStatus;
}

export const setAssetStatusAction = createAction<SetAssetStatusPayload>('assets/SET_ASSET_STATUS');

type PutAssetsAsIsPayload =
  | {
      type: 'tokens';
      assets: StoredToken[];
    }
  | {
      type: 'collectibles';
      assets: StoredCollectible[];
    };

export const putAssetsAsIsAction = createAction<PutAssetsAsIsPayload>('assets/PUT_ASSETS_AS_IS');
