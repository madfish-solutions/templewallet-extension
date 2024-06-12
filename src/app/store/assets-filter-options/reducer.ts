import { createReducer } from '@reduxjs/toolkit';

import {
  setTokensFilterChain,
  setTokensHideZeroBalanceFilterOption,
  setTokensGroupByNetworkFilterOption,
  resetTokensFilterOptions
} from './actions';
import {
  AssetsFilterOptionsInitialState,
  AssetsFilterOptionsStateInterface,
  DefaultTokensFilterOptions
} from './state';

export const assetsFilterOptionsReducer = createReducer<AssetsFilterOptionsStateInterface>(
  AssetsFilterOptionsInitialState,
  builder => {
    builder.addCase(resetTokensFilterOptions, state => {
      state.tokensOptions = DefaultTokensFilterOptions;
    });
    builder.addCase(setTokensFilterChain, (state, { payload }) => {
      state.tokensOptions.filterChain = payload;
    });
    builder.addCase(setTokensHideZeroBalanceFilterOption, (state, { payload }) => {
      console.log(payload, 'payload');
      state.tokensOptions.hideZeroBalance = payload;
    });
    builder.addCase(setTokensGroupByNetworkFilterOption, (state, { payload }) => {
      state.tokensOptions.groupByNetwork = payload;
    });
  }
);
