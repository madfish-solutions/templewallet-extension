import { createReducer } from '@reduxjs/toolkit';

import { proceedLoadedEVMTokensMetadataAction } from '../tokens-metadata/actions';

import { evmCurrencyInitialState, EVMCurrencyState } from './state';
import { getStoredExchangeRatesRecord } from './utils';

export const evmCurrencyReducer = createReducer<EVMCurrencyState>(evmCurrencyInitialState, builder => {
  builder.addCase(proceedLoadedEVMTokensMetadataAction, (state, { payload }) => {
    const { data } = payload;

    if (data.length === 0) return;

    state.usdToTokenRates = Object.assign({}, state.usdToTokenRates, getStoredExchangeRatesRecord(data));
  });
});
