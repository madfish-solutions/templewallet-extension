import { createReducer } from '@reduxjs/toolkit';

import { processLoadedEvmExchangeRatesAction } from './actions';
import { evmTokensExchangeRatesInitialState, EvmTokensExchangeRateState } from './state';
import { getTokenSlugExchangeRateRecord } from './utils';

export const evmTokensExchangeRatesReducer = createReducer<EvmTokensExchangeRateState>(
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
