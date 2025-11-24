import { createReducer } from '@reduxjs/toolkit';
import { isDefined } from '@rnw-community/shared';
import { persistReducer } from 'redux-persist';
import { getAddress } from 'viem';

import { toTokenSlug } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { EVM_ZERO_ADDRESS } from 'lib/constants';
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
      if ('lifiItems' in data) {
        for (const item of data.lifiItems) {
          const slug = item.address === EVM_ZERO_ADDRESS ? EVM_TOKEN_SLUG : toTokenSlug(getAddress(item.address), 0);

          records[slug] = Number(item.priceUSD);
        }
      } else {
        for (const item of data.items) {
          if (!isDefined(item.quote_rate)) {
            // delete records[slug]; // Consider discarding old rates in the future (for ghost tokens)
            continue;
          }

          const slug = item.native_token ? EVM_TOKEN_SLUG : toTokenSlug(getAddress(item.contract_address));

          records[slug] = item.quote_rate;
        }
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
