import { createAction } from '@reduxjs/toolkit';

import { FilterChain } from './state';

export const resetTokensFilterOptions = createAction('assets-filter-options/RESET_TOKENS_FILTER_OPTIONS');

export const setAssetsFilterChain = createAction<FilterChain>('assets-filter-options/SET_ASSETS_FILTER_CHAIN_ID');

export const setTokensHideZeroBalanceFilterOption = createAction<boolean>(
  'assets-filter-options/SET_TOKENS_HIDE_ZERO_BALANCE_FILTER_OPTION'
);

export const setTokensGroupByNetworkFilterOption = createAction<boolean>(
  'assets-filter-options/SET_TOKENS_GROUP_BY_NETWORK_FILTER_OPTION'
);

export const setCollectiblesBlurFilterOption = createAction<boolean>(
  'assets-filter-options/SET_COLLECTIBLES_BLUR_FILTER_OPTION'
);

export const setCollectiblesShowInfoFilterOption = createAction<boolean>(
  'assets-filter-options/SET_COLLECTIBLES_SHOW_INFO_FILTER_OPTION'
);
