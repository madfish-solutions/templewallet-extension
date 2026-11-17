import { createReducer } from '@reduxjs/toolkit';
import { isNil, omitBy } from 'lodash';
import { createMigrate, persistReducer, type PersistedState } from 'redux-persist';
import { getAddress } from 'viem';

import { toTokenSlug } from 'lib/assets';
import { EvmCollectibleMetadata } from 'lib/metadata/types';
import { storageConfig } from 'lib/store';
import { isProperCollectibleMetadata } from 'lib/utils/evm.utils';

import {
  loadEvmCollectiblesMetadataAction,
  markEvmCollectibleSlugsCheckedAction,
  markEvmCollectiblesMetadataChainLoadedAction,
  processLoadedEvmCollectiblesMetadataAction,
  putEvmCollectiblesMetadataAction
} from './actions';
import { evmCollectiblesMetadataInitialState, EvmCollectiblesMetadataState } from './state';
import { assignSingleContractCollectionNames, buildEvmCollectibleMetadataFromFetched } from './utils';

// TODO: figure out how to get rid of unused metadata

const isMissingValue = (value: unknown) => isNil(value) || value === '';

const countFilledFields = (metadata: object) => Object.keys(omitBy(metadata, isMissingValue)).length;

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
          const fetched = buildEvmCollectibleMetadataFromFetched(collectible, contract);

          if (!stored) {
            chainTokensMetadata[slug] = fetched;
            continue;
          }

          const merged = { ...fetched, ...omitBy(stored, isMissingValue) };
          if (countFilledFields(merged) > countFilledFields(stored)) chainTokensMetadata[slug] = merged;
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

        const stored = chainCollectiblesMetadata[slug];

        if (!stored) {
          chainCollectiblesMetadata[slug] = metadata;
          continue;
        }

        const merged = { ...metadata, ...omitBy(stored, isMissingValue) };
        if (countFilledFields(merged) > countFilledFields(stored)) chainCollectiblesMetadata[slug] = merged;
      }

      assignSingleContractCollectionNames(chainCollectiblesMetadata);
    });

    builder.addCase(loadEvmCollectiblesMetadataAction, (state, { payload: { publicKeyHash } }) => {
      if (state.lastFullLoadAccount === publicKeyHash) return;

      state.lastFullLoadAccount = publicKeyHash;
      state.seenChainsByAccount[publicKeyHash] = [];
      state.checkedSlugsByAccount[publicKeyHash] = {};
    });

    builder.addCase(markEvmCollectiblesMetadataChainLoadedAction, (state, { payload: { publicKeyHash, chainId } }) => {
      const seenChains = (state.seenChainsByAccount[publicKeyHash] ??= []);

      if (!seenChains.includes(chainId)) seenChains.push(chainId);
    });

    builder.addCase(markEvmCollectibleSlugsCheckedAction, (state, { payload }) => {
      const { publicKeyHash, chainId, slugs, retryAt } = payload;
      const checkedByChain = (state.checkedSlugsByAccount[publicKeyHash] ??= {});
      const checked = (checkedByChain[chainId] ??= {});

      for (const slug of slugs) checked[slug] = retryAt === undefined || checked[slug] !== undefined ? true : retryAt;
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
    version: 1,
    ...storageConfig,
    blacklist: EVM_COLLECTIBLES_METADATA_PERSIST_BLACKLIST,
    throttle: 5_000,
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
