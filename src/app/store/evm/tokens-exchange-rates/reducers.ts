import { createReducer } from '@reduxjs/toolkit';

import { proceedLoadedEvmExchangeRatesAction } from './actions';
import { evmTokensExchangeRatesInitialState, EvmTokensExchangeRateState } from './state';
import { getTokenSlugExchangeRateRecord } from './utils';

export const evmTokensExchangeRatesReducer = createReducer<EvmTokensExchangeRateState>(
  evmTokensExchangeRatesInitialState,
  builder => {
    builder.addCase(proceedLoadedEvmExchangeRatesAction, ({ usdToTokenRates }, { payload }) => {
      const { chainId, data } = payload;

      usdToTokenRates[chainId] = Object.assign(
        {},
        usdToTokenRates[chainId] ?? {},
        getTokenSlugExchangeRateRecord(data.items)
      );
    });
  }
);
