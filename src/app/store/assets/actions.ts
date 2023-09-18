import { createAction } from '@reduxjs/toolkit';

import { createActions } from 'lib/store';

import { StorredToken } from './state';

export const loadAccountTokensActions = createActions<
  { account: string; chainId: string },
  { account: string; chainId: string; slugs: string[] },
  { code?: number }
>('assets/LOAD_ACCOUNT_TOKENS');

type TokenStatusAlterPayload = Pick<StorredToken, 'account' | 'chainId' | 'slug'>;

export const setTokenStatusToRemovedAction = createAction<TokenStatusAlterPayload>('assets/SET_TOKEN_REMOVED');

export const toggleTokenStatusAction = createAction<TokenStatusAlterPayload>('assets/TOGGLE_TOKEN_STATUS');
