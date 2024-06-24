import { createReducer } from '@reduxjs/toolkit';
import { getAddress } from 'viem';

import { toTokenSlug } from 'lib/assets';
import { isProperCollectibleMetadata } from 'lib/utils/evm.utils';

import { processLoadedEvmCollectiblesMetadataAction, putEvmCollectiblesMetadataAction } from './actions';
import { evmCollectiblesMetadataInitialState, EvmCollectiblesMetadataState } from './state';
import { buildEvmCollectibleMetadataFromFetched } from './utils';

// TODO: figure out how to get rid of unused metadata

export const evmCollectiblesMetadataReducer = createReducer<EvmCollectiblesMetadataState>(
  evmCollectiblesMetadataInitialState,
  builder => {
    builder.addCase(processLoadedEvmCollectiblesMetadataAction, ({ metadataRecord }, { payload }) => {
      const { chainId, data } = payload;

      if (!metadataRecord[chainId]) metadataRecord[chainId] = {};
      const chainTokensMetadata = metadataRecord[chainId];

      const contracts = data.items;

      for (const contract of contracts) {
        const collectibles = contract.nft_data;

        for (const collectible of collectibles) {
          if (!isProperCollectibleMetadata(collectible)) continue;

          const slug = toTokenSlug(getAddress(contract.contract_address), collectible.token_id);

          const stored = chainTokensMetadata[slug];
          if (!stored) chainTokensMetadata[slug] = buildEvmCollectibleMetadataFromFetched(collectible, contract);
        }
      }
    });

    builder.addCase(putEvmCollectiblesMetadataAction, ({ metadataRecord }, { payload }) => {
      const { chainId, records } = payload;

      if (!metadataRecord[chainId]) metadataRecord[chainId] = {};
      const chainCollectiblesMetadata = metadataRecord[chainId];

      for (const slug of Object.keys(records)) {
        const metadata = records[slug];
        if (!metadata) continue;

        const stored = chainCollectiblesMetadata[slug];
        if (!stored) chainCollectiblesMetadata[slug] = metadata;
      }
    });
  }
);
