import { createReducer, isDraft, original } from '@reduxjs/toolkit';
import { isNil } from 'lodash';
import { createMigrate, persistReducer, type PersistedState } from 'redux-persist';
import { getAddress } from 'viem';

import { fromAssetSlug, toTokenSlug } from 'lib/assets';
import { EvmCollectibleMetadata } from 'lib/metadata/types';
import { stringStorageConfig } from 'lib/store';
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

const filledFields = (metadata: object) =>
  Object.fromEntries(Object.entries(metadata).filter(([, value]) => !isMissingValue(value)));

const countFilledFields = (metadata: object) => Object.values(metadata).filter(value => !isMissingValue(value)).length;

/** The record to store for a slug: the incoming one, a merge that fills more fields, or nothing. */
const nextStoredMetadata = (incoming: EvmCollectibleMetadata, stored: EvmCollectibleMetadata | undefined) => {
  if (!stored) return incoming;

  const merged = { ...incoming, ...filledFields(stored) };

  return countFilledFields(merged) > countFilledFields(stored) ? merged : undefined;
};

/** Stored records are read from the state before this update, so a read does not create an immer draft. */
const chainMetadataWriter = (chain: StringRecord<EvmCollectibleMetadata>) => {
  const before = isDraft(chain) ? original(chain) : chain;
  const written = new Set<string>();

  return (slug: string, incoming: EvmCollectibleMetadata) => {
    const next = nextStoredMetadata(incoming, written.has(slug) ? chain[slug] : before?.[slug]);
    if (!next) return;

    chain[slug] = next;
    written.add(slug);
  };
};

const evmCollectiblesMetadataReducer = createReducer<EvmCollectiblesMetadataState>(
  evmCollectiblesMetadataInitialState,
  builder => {
    builder.addCase(processLoadedEvmCollectiblesMetadataAction, ({ metadataRecord }, { payload }) => {
      const { chainId, data } = payload;

      if (!metadataRecord[chainId]) metadataRecord[chainId] = {};
      const chainTokensMetadata = metadataRecord[chainId];

      const contracts = data.items;
      const write = chainMetadataWriter(chainTokensMetadata);

      for (const contract of contracts) {
        let address: string | undefined;

        for (const collectible of contract.nft_data) {
          if (!isProperCollectibleMetadata(collectible)) continue;

          address ??= getAddress(contract.contract_address);
          write(
            toTokenSlug(address, collectible.token_id),
            buildEvmCollectibleMetadataFromFetched(collectible, contract)
          );
        }
      }

      assignSingleContractCollectionNames(
        chainTokensMetadata,
        new Set(contracts.map(contract => contract.contract_address.toLowerCase()))
      );
    });

    builder.addCase(putEvmCollectiblesMetadataAction, ({ metadataRecord }, { payload }) => {
      const { chainId, records } = payload;

      if (!metadataRecord[chainId]) metadataRecord[chainId] = {};
      const chainCollectiblesMetadata = metadataRecord[chainId];
      const write = chainMetadataWriter(chainCollectiblesMetadata);

      for (const slug of Object.keys(records)) {
        const metadata = records[slug];
        if (metadata) write(slug, metadata);
      }

      assignSingleContractCollectionNames(
        chainCollectiblesMetadata,
        new Set(Object.keys(records).map(slug => fromAssetSlug(slug)[0].toLowerCase()))
      );
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
    ...stringStorageConfig,
    blacklist: EVM_COLLECTIBLES_METADATA_PERSIST_BLACKLIST,
    throttle: 10_000,
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
