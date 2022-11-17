import { createReducer } from '@reduxjs/toolkit';

import { createEntity } from '../create-entity';
import { loadExchangeRates } from './actions';
import { currencyInitialState, CurrencyState } from './state';

export const currencyReducer = createReducer<CurrencyState>(currencyInitialState, builder => {
  builder.addCase(loadExchangeRates.submit, state => ({
    ...state,
    usdToTokenRates: createEntity(state.usdToTokenRates.data, true),
    fiatToTezosRates: createEntity(state.fiatToTezosRates.data, true)
  }));
  builder.addCase(loadExchangeRates.success, (state, { payload }) => ({
    ...state,
    usdToTokenRates: createEntity(payload.usdToTokenRates),
    fiatToTezosRates: createEntity(payload.fiatToTezosRates)
  }));
  builder.addCase(loadExchangeRates.fail, (state, { payload }) => ({
    ...state,
    usdToTokenRates: createEntity(state.usdToTokenRates.data, false, payload),
    fiatToTezosRates: createEntity(state.fiatToTezosRates.data, false, payload)
  }));
});
