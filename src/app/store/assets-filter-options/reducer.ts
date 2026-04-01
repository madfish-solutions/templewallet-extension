import { createReducer } from '@reduxjs/toolkit';

import {
  setAssetsFilterChain,
  setTokensHideSmallBalanceFilterOption,
  setTokensGroupByNetworkFilterOption,
  resetTokensFilterOptions,
  setCollectiblesBlurFilterOption,
  setCollectiblesShowInfoFilterOption,
  swapOptionsForTestnetSwitch
} from './actions';
import { AssetsFilterOptionsInitialState, AssetsFilterOptionsStateInterface, modeOptionsInitialState } from './state';

export const assetsFilterOptionsReducer = createReducer<AssetsFilterOptionsStateInterface>(
  AssetsFilterOptionsInitialState,
  builder => {
    builder.addCase(resetTokensFilterOptions, state => ({
      ...modeOptionsInitialState,
      storedMainnetOptions: state.storedMainnetOptions,
      storedTestnetOptions: state.storedTestnetOptions
    }));

    builder.addCase(setAssetsFilterChain, (state, { payload }) => {
      state.filterChain = payload;
    });

    builder.addCase(swapOptionsForTestnetSwitch, (state, { payload: leavingTestnet }) => {
      const current = {
        filterChain: state.filterChain,
        tokensListOptions: state.tokensListOptions,
        collectiblesListOptions: state.collectiblesListOptions
      };

      if (leavingTestnet) {
        return { ...state, ...state.storedMainnetOptions, storedTestnetOptions: current };
      }

      return { ...state, ...state.storedTestnetOptions, storedMainnetOptions: current };
    });

    builder.addCase(setTokensHideSmallBalanceFilterOption, (state, { payload }) => {
      state.tokensListOptions.hideSmallBalance = payload;
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
