import { createAction } from '@reduxjs/toolkit';

import { WhitelistResponseToken } from 'lib/apis/temple';
import { createActions } from 'lib/store';

import { StoredAssetStatus, StoredAsset } from './state';

interface LoadTokensPayload {
  /** PKH */
  account: string;
  chainId: string;
}

export const loadAccountTokensActions = createActions<
  LoadTokensPayload,
  LoadTokensPayload & { slugs: string[] },
  { code?: string }
>('assets/LOAD_ACCOUNT_TOKENS');

export const loadAccountCollectiblesActions = createActions<
  LoadTokensPayload,
  LoadTokensPayload & { slugs: string[] },
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

/** Adds asset record too, if absent */
export const setAssetStatusAction = createAction<SetAssetStatusPayload>('assets/SET_ASSET_STATUS');
