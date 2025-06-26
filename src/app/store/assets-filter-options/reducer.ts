import { createReducer } from '@reduxjs/toolkit';

import {
  setAssetsFilterChain,
  setTokensHideZeroBalanceFilterOption,
  setTokensGroupByNetworkFilterOption,
  resetTokensFilterOptions,
  setCollectiblesBlurFilterOption,
  setCollectiblesShowInfoFilterOption
} from './actions';
import { AssetsFilterOptionsInitialState, AssetsFilterOptionsStateInterface } from './state';

export const assetsFilterOptionsReducer = createReducer<AssetsFilterOptionsStateInterface>(
  AssetsFilterOptionsInitialState,
  builder => {
    builder.addCase(resetTokensFilterOptions, () => AssetsFilterOptionsInitialState);

    builder.addCase(setAssetsFilterChain, (state, { payload }) => {
      state.filterChain = payload;
    });

    builder.addCase(setTokensHideZeroBalanceFilterOption, (state, { payload }) => {
      state.tokensListOptions.hideZeroBalance = payload;
    });
    builder.addCase(setTokensGroupByNetworkFilterOption, (state, { payload }) => {
      state.tokensListOptions.groupByNetwork = payload;
    });

    builder.addCase(setCollectiblesBlurFilterOption, (state, { payload }) => {
      state.collectiblesListOptions.blur = payload;
    });
    builder.addCase(setCollectiblesShowInfoFilterOption, (state, { payload }) => {
      state.collectiblesListOptions.showInfo = payload;
    });
  }
);
