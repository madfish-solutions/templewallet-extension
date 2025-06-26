import { createReducer } from '@reduxjs/toolkit';

import { createEntity } from 'lib/store';

import { forgetIsAccountInitializedAction, loadIsAccountInitializedActions } from './actions';
import { accountsInitializationInitialState } from './state';

export const accountsInitializationReducer = createReducer(accountsInitializationInitialState, builder => {
  builder.addCase(loadIsAccountInitializedActions.submit, (state, { payload }) => {
    state.values[payload.id] = createEntity(undefined, true);
  });
  builder.addCase(loadIsAccountInitializedActions.success, (state, { payload }) => {
    state.values[payload.id] = createEntity(payload.initialized);
  });
  builder.addCase(loadIsAccountInitializedActions.fail, (state, { payload }) => {
    state.values[payload.id] = createEntity(undefined, false, payload.error);
  });

  builder.addCase(forgetIsAccountInitializedAction, (state, { payload }) => {
    payload.forEach(accountId => delete state.values[accountId]);
  });
});
