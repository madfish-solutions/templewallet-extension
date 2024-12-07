import { createReducer } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';

import { createEntity, storageConfig } from 'lib/store';

import { loadExolixCurrenciesActions } from './actions';
import { cryptoExchangeInitialState, CryptoExchangeState } from './state';

const cryptoExchangeReducer = createReducer<CryptoExchangeState>(cryptoExchangeInitialState, builder => {
  builder.addCase(loadExolixCurrenciesActions.submit, state => {
    state.exolixCurrencies.isLoading = true;
  });

  builder.addCase(loadExolixCurrenciesActions.success, (state, { payload: currencies }) => ({
    ...state,
    exolixCurrencies: createEntity(currencies)
  }));

  builder.addCase(loadExolixCurrenciesActions.fail, (state, { payload: error }) => ({
    ...state,
    exolixCurrencies: createEntity(state.exolixCurrencies.data, false, error)
  }));
});

export const cryptoExchangePersistedReducer = persistReducer(
  {
    key: 'root.cryptoExchange',
    ...storageConfig
  },
  cryptoExchangeReducer
);
