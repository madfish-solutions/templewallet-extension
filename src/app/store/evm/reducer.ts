import { createReducer } from '@reduxjs/toolkit';

import {
  setEvmBalancesLoadingState,
  setEvmTokensMetadataLoading,
  setEvmCollectiblesMetadataLoading,
  setEvmTokensExchangeRatesLoading
} from './actions';
import { EvmLoadingInitialState, EvmLoadingStateInterface } from './state';

export const evmLoadingReducer = createReducer<EvmLoadingStateInterface>(EvmLoadingInitialState, builder => {
  builder.addCase(setEvmBalancesLoadingState, (state, { payload: { chainId, ...stateForChain } }) => {
    state.balances[chainId] = stateForChain;
  });

  builder.addCase(setEvmTokensMetadataLoading, (state, { payload }) => {
    state.tokensMetadataLoading = payload;
  });

  builder.addCase(setEvmCollectiblesMetadataLoading, (state, { payload }) => {
    state.collectiblesMetadataLoading = payload;
  });

  builder.addCase(setEvmTokensExchangeRatesLoading, (state, { payload }) => {
    state.tokensExchangeRatesLoading = payload;
  });
});
