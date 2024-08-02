import { createReducer } from '@reduxjs/toolkit';

import {
  setEvmBalancesLoading,
  setEvmTokensMetadataLoading,
  setEvmCollectiblesMetadataLoading,
  setEvmTokensExchangeRatesLoading
} from './actions';
import { EvmLoadingInitialState, EvmLoadingStateInterface } from './state';

export const evmLoadingReducer = createReducer<EvmLoadingStateInterface>(EvmLoadingInitialState, builder => {
  builder.addCase(setEvmBalancesLoading, (state, { payload }) => {
    state.balancesLoading = payload;
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
