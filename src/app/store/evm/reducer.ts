import { createReducer } from '@reduxjs/toolkit';

import { loadEvmCollectiblesMetadataActions, loadEvmTokensMetadataActions, setEvmBalancesLoading } from './actions';
import { EvmInitialState, EvmStateInterface } from './state';

export const evmReducer = createReducer<EvmStateInterface>(EvmInitialState, builder => {
  builder.addCase(setEvmBalancesLoading, (state, { payload }) => {
    state.balancesLoading = payload;
  });

  builder.addCase(loadEvmTokensMetadataActions.submit, (state, { payload }) => {
    state.tokensMetadataLoadingStateRecord[payload.chainId] = { isLoading: true };
  });
  builder.addCase(loadEvmTokensMetadataActions.success, (state, { payload }) => {
    state.tokensMetadataLoadingStateRecord[payload.chainId] = { isLoading: false };
  });
  builder.addCase(loadEvmTokensMetadataActions.fail, (state, { payload }) => {
    state.tokensMetadataLoadingStateRecord[payload.chainId] = { isLoading: false, error: payload.error };
  });

  builder.addCase(loadEvmCollectiblesMetadataActions.submit, (state, { payload }) => {
    state.collectiblesMetadataLoadingStateRecord[payload.chainId] = { isLoading: true };
  });
  builder.addCase(loadEvmCollectiblesMetadataActions.success, (state, { payload }) => {
    state.collectiblesMetadataLoadingStateRecord[payload.chainId] = { isLoading: false };
  });
  builder.addCase(loadEvmCollectiblesMetadataActions.fail, (state, { payload }) => {
    state.collectiblesMetadataLoadingStateRecord[payload.chainId] = { isLoading: false, error: payload.error };
  });
});
