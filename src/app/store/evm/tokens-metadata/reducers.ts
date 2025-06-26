import { createReducer } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import { getAddress } from 'viem';

import { toTokenSlug } from 'lib/assets';
import { storageConfig } from 'lib/store';
import { isPositiveTokenBalance } from 'lib/utils/evm.utils';

import { processLoadedEvmTokensMetadataAction, putEvmTokensMetadataAction } from './actions';
import { evmTokensMetadataInitialState, EvmTokensMetadataState } from './state';
import { buildEvmTokenMetadataFromFetched, isValidFetchedEvmMetadata } from './utils';

// TODO: figure out how to get rid of unused metadata

const evmTokensMetadataReducer = createReducer<EvmTokensMetadataState>(evmTokensMetadataInitialState, builder => {
  builder.addCase(processLoadedEvmTokensMetadataAction, ({ metadataRecord }, { payload }) => {
    const { chainId, data } = payload;

    if (!metadataRecord[chainId]) metadataRecord[chainId] = {};
    const chainTokensMetadata = metadataRecord[chainId];

    const items = data.items;

    for (const item of items) {
      if (item.native_token || !isPositiveTokenBalance(item)) continue;

      const contractAddress = getAddress(item.contract_address);
      const slug = toTokenSlug(contractAddress);

      if (!chainTokensMetadata[slug] && isValidFetchedEvmMetadata(item))
        chainTokensMetadata[slug] = buildEvmTokenMetadataFromFetched(item, contractAddress);
    }
  });

  builder.addCase(putEvmTokensMetadataAction, ({ metadataRecord }, { payload }) => {
    const { chainId, records } = payload;

    if (!metadataRecord[chainId]) metadataRecord[chainId] = {};
    const chainTokensMetadata = metadataRecord[chainId];

    for (const slug of Object.keys(records)) {
      const metadata = records[slug];
      if (!metadata) continue;

      chainTokensMetadata[slug] = metadata;
    }
  });
});

export const evmTokensMetadataPersistedReducer = persistReducer(
  {
    key: 'root.evmTokensMetadata',
    ...storageConfig
  },
  evmTokensMetadataReducer
);
