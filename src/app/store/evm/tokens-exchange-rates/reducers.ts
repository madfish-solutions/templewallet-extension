import { createReducer } from '@reduxjs/toolkit';
import { isDefined } from '@rnw-community/shared';
import { persistReducer } from 'redux-persist';
import { getAddress } from 'viem';

import { toTokenSlug } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { storageConfig } from 'lib/store';

import { processLoadedEvmExchangeRatesAction } from './actions';
import { evmTokensExchangeRatesInitialState, EvmTokensExchangeRateState } from './state';

const evmTokensExchangeRatesReducer = createReducer<EvmTokensExchangeRateState>(
  evmTokensExchangeRatesInitialState,
  builder => {
    builder.addCase(processLoadedEvmExchangeRatesAction, ({ usdToTokenRates, timestamps }, { payload }) => {
      const { chainId, data, timestamp } = payload;

      timestamps[chainId] = timestamp;
      if (!usdToTokenRates[chainId]) usdToTokenRates[chainId] = {};
      const records = usdToTokenRates[chainId];

      for (const item of data.items) {
        if (!isDefined(item.quote_rate)) {
          // delete records[slug]; // Consider discarding old rates in the future (for ghost tokens)
          continue;
        }

        const slug = item.native_token ? EVM_TOKEN_SLUG : toTokenSlug(getAddress(item.contract_address));

        records[slug] = item.quote_rate;
      }
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
