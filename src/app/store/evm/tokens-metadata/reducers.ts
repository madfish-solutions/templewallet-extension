import { createReducer } from '@reduxjs/toolkit';

import { toTokenSlug } from 'lib/assets';
import { isPositiveTokenBalance } from 'lib/utils/evm.utils';

import { proceedLoadedEvmTokensMetadataAction } from './actions';
import { evmTokensMetadataInitialState, EvmTokensMetadataState } from './state';
import { buildEvmTokenMetadataFromFetched } from './utils';

// TODO: figure out how to get rid of unused metadata

export const evmTokensMetadataReducer = createReducer<EvmTokensMetadataState>(
  evmTokensMetadataInitialState,
  builder => {
    builder.addCase(proceedLoadedEvmTokensMetadataAction, ({ metadataRecord }, { payload }) => {
      const { chainId, data } = payload;

      if (!metadataRecord[chainId]) metadataRecord[chainId] = {};
      const chainTokensMetadata = metadataRecord[chainId];

      const items = data.items;

      for (const item of items) {
        if (!item.native_token && !isPositiveTokenBalance(item)) continue;

        const slug = toTokenSlug(item.contract_address);

        const stored = chainTokensMetadata[slug];
        if (!stored) chainTokensMetadata[slug] = buildEvmTokenMetadataFromFetched(item);
      }
    });
  }
);
