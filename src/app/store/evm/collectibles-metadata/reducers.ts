import { createReducer } from '@reduxjs/toolkit';
import { createMigrate, persistReducer, type PersistedState } from 'redux-persist';
import { getAddress } from 'viem';

import { toTokenSlug } from 'lib/assets';
import { EvmCollectibleMetadata } from 'lib/metadata/types';
import { storageConfig } from 'lib/store';
import { isProperCollectibleMetadata } from 'lib/utils/evm.utils';

import {
  processLoadedEvmCollectiblesMetadataAction,
  propagateEvmContractCollectionNamesAction,
  putEvmCollectiblesMetadataAction,
  updateEvmCollectiblesMetadataSessionAction
} from './actions';
import { evmCollectiblesMetadataInitialState, EvmCollectiblesMetadataState } from './state';
import { assignSingleContractCollectionNames, buildEvmCollectibleMetadataFromFetched } from './utils';

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
          const fetched = buildEvmCollectibleMetadataFromFetched(collectible, contract);
          const stored = chainTokensMetadata[slug];

          if (!stored) {
            chainTokensMetadata[slug] = fetched;
            continue;
          }

          // A later response is the current metadata. A stored URL can still load after the NFT art changes.
          if (fetched.image) stored.image = fetched.image;
          else delete stored.image;

          if (fetched.images?.length) stored.images = fetched.images;
          else delete stored.images;

          if (fetched.artifactUrl) stored.artifactUrl = fetched.artifactUrl;
          if (!stored.name && fetched.name) stored.name = fetched.name;
        }
      }

      assignSingleContractCollectionNames(chainTokensMetadata);
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

      assignSingleContractCollectionNames(chainCollectiblesMetadata);
    });

    builder.addCase(propagateEvmContractCollectionNamesAction, ({ metadataRecord }) => {
      for (const records of Object.values(metadataRecord)) {
        assignSingleContractCollectionNames(records);
      }
    });

    builder.addCase(updateEvmCollectiblesMetadataSessionAction, (state, { payload }) => {
      const { publicKeyHash, lastFullLoadAccount, seenChains, checkedSlugsByChain, onChainSlugsByChain } = payload;

      state.lastFullLoadAccount = lastFullLoadAccount;
      state.seenChainsByAccount[publicKeyHash] = seenChains;
      state.checkedSlugsByAccount[publicKeyHash] = checkedSlugsByChain;
      state.onChainSlugsByAccount[publicKeyHash] = onChainSlugsByChain;
    });
  }
);

const EVM_COLLECTIBLES_METADATA_PERSIST_BLACKLIST: Array<keyof EvmCollectiblesMetadataState> = [
  'lastFullLoadAccount',
  'seenChainsByAccount',
  'checkedSlugsByAccount',
  'onChainSlugsByAccount'
];

export const evmCollectiblesMetadataPersistedReducer = persistReducer(
  {
    key: 'root.evmCollectiblesMetadata',
    version: 1,
    ...storageConfig,
    blacklist: EVM_COLLECTIBLES_METADATA_PERSIST_BLACKLIST,
    migrate: createMigrate({
      1: persistedState => addStoredCollectibleImageVariants(persistedState)
    })
  },
  evmCollectiblesMetadataReducer
);

const addStoredCollectibleImageVariants = (persistedState: PersistedState): PersistedState => {
  if (!persistedState || typeof persistedState !== 'object' || !('metadataRecord' in persistedState)) {
    return persistedState;
  }

  const source = persistedState.metadataRecord;
  if (!source || typeof source !== 'object') return persistedState;

  const metadataRecord: EvmCollectiblesMetadataState['metadataRecord'] = {};

  for (const [chainId, chainMetadata] of Object.entries(source)) {
    if (!chainMetadata || typeof chainMetadata !== 'object') continue;

    const nextChain: Record<string, EvmCollectibleMetadata> = {};

    for (const [slug, metadata] of Object.entries(chainMetadata)) {
      if (!isCollectibleMetadata(metadata)) continue;

      nextChain[slug] =
        !metadata.images?.length && metadata.image ? { ...metadata, images: [metadata.image] } : metadata;
    }

    metadataRecord[Number(chainId)] = nextChain;
  }

  return Object.assign({ ...persistedState }, { metadataRecord });
};

const isCollectibleMetadata = (value: unknown): value is EvmCollectibleMetadata =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);
