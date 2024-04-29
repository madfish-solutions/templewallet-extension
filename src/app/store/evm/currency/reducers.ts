import { createReducer } from '@reduxjs/toolkit';

import { proceedLoadedEvmExchangeRatesAction } from './actions';
import { evmCurrencyInitialState, EvmCurrencyState } from './state';
import { getTokenSlugExchangeRateRecord } from './utils';

export const evmCurrencyReducer = createReducer<EvmCurrencyState>(evmCurrencyInitialState, builder => {
  builder.addCase(proceedLoadedEvmExchangeRatesAction, ({ usdToTokenRates }, { payload }) => {
    const { chainId, data } = payload;

    usdToTokenRates[chainId] = Object.assign(
      {},
      usdToTokenRates[chainId] ?? {},
      getTokenSlugExchangeRateRecord(data.items)
    );
  });
});
