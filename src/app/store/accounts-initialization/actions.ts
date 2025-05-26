import { createAction } from '@reduxjs/toolkit';

import { createActions } from 'lib/store';

interface LoadIsAccountInitializedSubmitPayload {
  tezosAddress?: string;
  evmAddress?: string;
  id: string;
}

interface LoadIsAccountInitializedSuccessPayload {
  id: string;
  initialized: boolean | undefined;
}

interface LoadIsAccountInitializedErrorPayload {
  id: string;
  error: string;
}

export const loadIsAccountInitializedActions = createActions<
  LoadIsAccountInitializedSubmitPayload,
  LoadIsAccountInitializedSuccessPayload,
  LoadIsAccountInitializedErrorPayload
>('accounts-initialization/SET_IS_ACCOUNT_INITIALIZED');

export const forgetIsAccountInitializedAction = createAction<string[]>(
  'accounts-initialization/FORGET_IS_ACCOUNT_INITIALIZED'
);
