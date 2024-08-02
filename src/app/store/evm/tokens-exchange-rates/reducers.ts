import { createReducer } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';

import { storageConfig } from 'lib/store';

import { processLoadedEvmExchangeRatesAction } from './actions';
import { evmTokensExchangeRatesInitialState, EvmTokensExchangeRateState } from './state';
import { getTokenSlugExchangeRateRecord } from './utils';

const evmTokensExchangeRatesReducer = createReducer<EvmTokensExchangeRateState>(
  evmTokensExchangeRatesInitialState,
  builder => {
    builder.addCase(processLoadedEvmExchangeRatesAction, ({ usdToTokenRates }, { payload }) => {
      const { chainId, data } = payload;

      usdToTokenRates[chainId] = Object.assign(
        {},
        usdToTokenRates[chainId] ?? {},
        getTokenSlugExchangeRateRecord(data.items)
      );
    });
  }
);

export const evmTokensExchangeRatesPersistedReducer = persistReducer(
  {
    key: 'root.evmTokensExchangeRates',
    ...storageConfig
  },
  evmTokensExchangeRatesReducer
);
