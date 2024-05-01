import { createReducer } from '@reduxjs/toolkit';

import { loadSingleEvmChainCollectiblesActions, loadSingleEvmChainTokensActions } from './actions';
import { EvmInitialState, EvmStateInterface } from './state';

export const evmReducer = createReducer<EvmStateInterface>(EvmInitialState, builder => {
  builder.addCase(loadSingleEvmChainTokensActions.submit, (state, { payload }) => {
    state.tokensLoadingStateRecord[payload.chainId] = { isLoading: true };
  });
  builder.addCase(loadSingleEvmChainTokensActions.success, (state, { payload }) => {
    state.tokensLoadingStateRecord[payload.chainId] = { isLoading: false };
  });
  builder.addCase(loadSingleEvmChainTokensActions.fail, (state, { payload }) => {
    state.tokensLoadingStateRecord[payload.chainId] = { isLoading: false, error: payload.error };
  });

  builder.addCase(loadSingleEvmChainCollectiblesActions.submit, (state, { payload }) => {
    state.collectiblesLoadingStateRecord[payload.chainId] = { isLoading: true };
  });
  builder.addCase(loadSingleEvmChainCollectiblesActions.success, (state, { payload }) => {
    state.collectiblesLoadingStateRecord[payload.chainId] = { isLoading: false };
  });
  builder.addCase(loadSingleEvmChainCollectiblesActions.fail, (state, { payload }) => {
    state.collectiblesLoadingStateRecord[payload.chainId] = { isLoading: false, error: payload.error };
  });
});
