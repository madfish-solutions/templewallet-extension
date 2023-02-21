import { createReducer } from '@reduxjs/toolkit';

import { createEntity } from 'lib/store';

import {
  loadRoute3DexesAction,
  loadRoute3SwapParamsAction,
  loadRoute3TokensAction,
  resetRoute3SwapParamsAction
} from './actions';
import { swapInitialState } from './state';

export const swapReducer = createReducer(swapInitialState, builder => {
  builder.addCase(loadRoute3TokensAction.submit, state => {
    state.tokens = createEntity([...state.tokens.data], true);
  });
  builder.addCase(loadRoute3TokensAction.success, (state, { payload }) => {
    state.tokens = createEntity(payload, false);
  });
  builder.addCase(loadRoute3TokensAction.fail, (state, { payload }) => {
    state.tokens = createEntity([], false, payload);
  });
  builder.addCase(loadRoute3SwapParamsAction.submit, state => {
    state.swapParams = createEntity({ ...state.swapParams.data }, true);
  });
  builder.addCase(loadRoute3SwapParamsAction.success, (state, { payload }) => {
    state.swapParams = createEntity(payload, false);
  });
  builder.addCase(loadRoute3SwapParamsAction.fail, (state, { payload }) => {
    state.swapParams = createEntity({ input: 0, output: 0, chains: [] }, false, payload);
  });
  builder.addCase(resetRoute3SwapParamsAction, state => {
    state.swapParams = createEntity({ input: undefined, output: undefined, chains: [] }, false);
  });
  builder.addCase(loadRoute3DexesAction.submit, state => {
    state.dexes = createEntity([...state.dexes.data], true);
  });
  builder.addCase(loadRoute3DexesAction.success, (state, { payload }) => {
    state.dexes = createEntity(payload, false);
  });
  builder.addCase(loadRoute3DexesAction.fail, (state, { payload }) => {
    state.dexes = createEntity([], false, payload);
  });
});
