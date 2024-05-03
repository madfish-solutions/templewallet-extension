import { createReducer } from '@reduxjs/toolkit';

import { loadEvmCollectiblesMetadataActions, loadEvmBalancesActions, loadEvmTokensMetadataActions } from './actions';
import { EvmInitialState, EvmStateInterface } from './state';

export const evmReducer = createReducer<EvmStateInterface>(EvmInitialState, builder => {
  builder.addCase(loadEvmBalancesActions.submit, (state, { payload }) => {
    state.balancesLoadingStateRecord[payload.chainId] = { isLoading: true };
  });
  builder.addCase(loadEvmBalancesActions.success, (state, { payload }) => {
    state.balancesLoadingStateRecord[payload.chainId] = { isLoading: false };
  });
  builder.addCase(loadEvmBalancesActions.fail, (state, { payload }) => {
    state.balancesLoadingStateRecord[payload.chainId] = { isLoading: false, error: payload.error };
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
