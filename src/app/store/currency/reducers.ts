import { createReducer } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';

import { createEntity, storageConfig } from 'lib/store';

import { loadExchangeRates } from './actions';
import { currencyInitialState, CurrencyState } from './state';

const currencyReducer = createReducer<CurrencyState>(currencyInitialState, builder => {
  builder.addCase(loadExchangeRates.submit, state => ({
    ...state,
    usdToTokenRates: createEntity(state.usdToTokenRates.data, true),
    fiatToTezosRates: createEntity(state.fiatToTezosRates.data, true),
    btcToUsdRate: createEntity(state.btcToUsdRate.data, true)
  }));

  builder.addCase(loadExchangeRates.success, (state, { payload }) => ({
    ...state,
    usdToTokenRates: createEntity(payload.usdToTokenRates),
    fiatToTezosRates: createEntity(payload.fiatToTezosRates),
    btcToUsdRate: createEntity(payload.btcToUsdRate)
  }));

  builder.addCase(loadExchangeRates.fail, (state, { payload }) => ({
    ...state,
    usdToTokenRates: createEntity(state.usdToTokenRates.data, false, payload),
    fiatToTezosRates: createEntity(state.fiatToTezosRates.data, false, payload),
    btcToUsdRate: createEntity(state.btcToUsdRate.data, false, payload)
  }));
});

export const currencyPersistedReducer = persistReducer(
  {
    key: 'root.currency',
    ...storageConfig
  },
  currencyReducer
);
