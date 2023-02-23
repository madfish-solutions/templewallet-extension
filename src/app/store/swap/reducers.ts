import { createReducer } from '@reduxjs/toolkit';

import { createEntity } from 'lib/store';

import { loadSwapDexesAction, loadSwapParamsAction, loadSwapTokensAction, resetSwapParamsAction } from './actions';
import { swapInitialState } from './state';

export const swapReducer = createReducer(swapInitialState, builder => {
  builder.addCase(loadSwapTokensAction.submit, state => {
    state.tokens = createEntity([...state.tokens.data], true);
  });
  builder.addCase(loadSwapTokensAction.success, (state, { payload }) => {
    state.tokens = createEntity(payload, false);
  });
  builder.addCase(loadSwapTokensAction.fail, (state, { payload }) => {
    state.tokens = createEntity([], false, payload);
  });
  builder.addCase(loadSwapParamsAction.submit, state => {
    state.swapParams = createEntity({ ...state.swapParams.data }, true);
  });
  builder.addCase(loadSwapParamsAction.success, (state, { payload }) => {
    state.swapParams = createEntity(payload, false);
  });
  builder.addCase(loadSwapParamsAction.fail, (state, { payload }) => {
    state.swapParams = createEntity({ input: 0, output: 0, chains: [] }, false, payload);
  });
  builder.addCase(resetSwapParamsAction, state => {
    state.swapParams = createEntity({ input: undefined, output: undefined, chains: [] }, false);
  });
  builder.addCase(loadSwapDexesAction.submit, state => {
    state.dexes = createEntity([...state.dexes.data], true);
  });
  builder.addCase(loadSwapDexesAction.success, (state, { payload }) => {
    state.dexes = createEntity(payload, false);
  });
  builder.addCase(loadSwapDexesAction.fail, (state, { payload }) => {
    state.dexes = createEntity([], false, payload);
  });
});
