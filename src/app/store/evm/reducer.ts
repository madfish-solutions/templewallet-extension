import { createReducer } from '@reduxjs/toolkit';

import { loadSingleEvmChainDataActions } from './actions';
import { EvmInitialState, EvmStateInterface } from './state';

export const evmReducer = createReducer<EvmStateInterface>(EvmInitialState, builder => {
  builder.addCase(loadSingleEvmChainDataActions.submit, (state, { payload }) => {
    state.loadingStateRecord[payload.chainId] = { isLoading: true };
  });
  builder.addCase(loadSingleEvmChainDataActions.success, (state, { payload }) => {
    state.loadingStateRecord[payload.chainId] = { isLoading: false };
  });
  builder.addCase(loadSingleEvmChainDataActions.fail, (state, { payload }) => {
    state.loadingStateRecord[payload.chainId] = { isLoading: false, error: payload.error };
  });
});
