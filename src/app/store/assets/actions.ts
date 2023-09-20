import { createAction } from '@reduxjs/toolkit';

import { WhitelistResponseToken } from 'lib/apis/temple';
import { createActions } from 'lib/store';

import { StoredAssetStatus, StoredToken } from './state';

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

type LoadWhitelistPayload = WhitelistResponseToken[];

export const loadTokensWhitelistActions = createActions<void, LoadWhitelistPayload, { code?: string }>(
  'assets/LOAD_TOKENS_WHITELIST'
);

interface SetTokenStatusPayload extends Pick<StoredToken, 'account' | 'chainId' | 'slug'> {
  status: StoredAssetStatus;
}

/** Adds token record too, if absent */
export const setTokenStatusAction = createAction<SetTokenStatusPayload>('assets/SET_TOKEN_STATUS');
