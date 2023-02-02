import { createReducer } from '@reduxjs/toolkit';

import { createEntity } from 'lib/store';

import { loadRoute3TokensAction } from './actions';
import { route3InitialState } from './state';

export const route3Reducer = createReducer(route3InitialState, builder => {
  builder.addCase(loadRoute3TokensAction.submit, state => {
    state.tokens = createEntity([...state.tokens.data], true);
  });
  builder.addCase(loadRoute3TokensAction.success, (state, { payload }) => {
    state.tokens = createEntity(payload, false);
  });
  builder.addCase(loadRoute3TokensAction.fail, (state, { payload }) => {
    state.tokens = createEntity([], false, payload);
  });
});
