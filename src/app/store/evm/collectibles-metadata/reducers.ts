import { createReducer } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import { getAddress } from 'viem';

import { toTokenSlug } from 'lib/assets';
import { storageConfig } from 'lib/store';
import { isProperCollectibleMetadata } from 'lib/utils/evm.utils';

import {
  processLoadedEvmCollectiblesMetadataAction,
  putEvmCollectiblesMetadataAction,
  updateEvmCollectiblesMetadataSessionAction
} from './actions';
import { evmCollectiblesMetadataInitialState, EvmCollectiblesMetadataState } from './state';
import { buildEvmCollectibleMetadataFromFetched } from './utils';

// TODO: figure out how to get rid of unused metadata

const evmCollectiblesMetadataReducer = createReducer<EvmCollectiblesMetadataState>(
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

        chainCollectiblesMetadata[slug] = metadata;
      }
    });

    builder.addCase(updateEvmCollectiblesMetadataSessionAction, (state, { payload }) => {
      const { publicKeyHash, lastFullLoadAccount, seenChains, checkedSlugsByChain } = payload;

      state.lastFullLoadAccount = lastFullLoadAccount;
      state.seenChainsByAccount[publicKeyHash] = seenChains;
      state.checkedSlugsByAccount[publicKeyHash] = checkedSlugsByChain;
    });
  }
);

const EVM_COLLECTIBLES_METADATA_PERSIST_BLACKLIST: Array<keyof EvmCollectiblesMetadataState> = [
  'lastFullLoadAccount',
  'seenChainsByAccount',
  'checkedSlugsByAccount'
];

export const evmCollectiblesMetadataPersistedReducer = persistReducer(
  {
    key: 'root.evmCollectiblesMetadata',
    ...storageConfig,
    blacklist: EVM_COLLECTIBLES_METADATA_PERSIST_BLACKLIST
  },
  evmCollectiblesMetadataReducer
);
