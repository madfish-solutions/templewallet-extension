import { createAction } from '@reduxjs/toolkit';

import { createActions } from 'lib/store';

export interface LoadIsAccountInitializedSubmitPayload {
  tezosAddress?: string;
  evmAddress?: string;
  id: string;
}

export interface LoadIsAccountInitializedSuccessPayload {
  id: string;
  initialized: boolean | undefined;
}

export const loadIsAccountInitializedActions = createActions<
  LoadIsAccountInitializedSubmitPayload,
  { id: string; initialized: boolean | undefined },
  { id: string; error: string }
>('accounts-initialization/SET_IS_ACCOUNT_INITIALIZED');

export const forgetIsAccountInitializedAction = createAction<string[]>(
  'accounts-initialization/FORGET_IS_ACCOUNT_INITIALIZED'
);
