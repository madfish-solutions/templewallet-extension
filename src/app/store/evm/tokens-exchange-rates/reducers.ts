import { createReducer } from '@reduxjs/toolkit';
import { isDefined } from '@rnw-community/shared';
import { persistReducer } from 'redux-persist';
import { getAddress } from 'viem';

import { putLifiEnabledNetworksEvmTokensCatalogueAction } from 'app/store/evm/swap-lifi-metadata/actions';
import { toTokenSlug } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { EVM_ZERO_ADDRESS } from 'lib/constants';
import { LifiEvmTokenMetadata } from 'lib/metadata/types';
import { storageConfig } from 'lib/store';

import { processLoadedEvmExchangeRatesAction } from './actions';
import { evmTokensExchangeRatesInitialState, EvmTokensExchangeRateState } from './state';

const writeLifiItemRate = (records: StringRecord<number>, item: LifiEvmTokenMetadata) => {
  if (!item.address) return;

  const price = Number(item.priceUSD);
  if (!Number.isFinite(price)) return;

  try {
    const slug = item.address === EVM_ZERO_ADDRESS ? EVM_TOKEN_SLUG : toTokenSlug(getAddress(item.address), 0);

    records[slug] = price;
  } catch (err) {
    console.error(err);
  }
};

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
          writeLifiItemRate(records, item);
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
    // Same dispatch as the catalogue write, so prices are not a second persist per chain.
    builder.addCase(putLifiEnabledNetworksEvmTokensCatalogueAction, ({ usdToTokenRates, timestamps }, { payload }) => {
      const { recordsByChainId, timestamp } = payload;

      for (const [chainIdStr, chainRecords] of Object.entries(recordsByChainId)) {
        const items = Object.values(chainRecords).filter((item): item is LifiEvmTokenMetadata => isDefined(item));
        if (!items.length) continue;

        const chainId = Number(chainIdStr);
        timestamps[chainId] = timestamp;
        if (!usdToTokenRates[chainId]) usdToTokenRates[chainId] = {};
        const records = usdToTokenRates[chainId];

        for (const item of items) {
          writeLifiItemRate(records, item);
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
