import { createReducer } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';

import { storageConfig } from 'lib/store';

import {
  appendEvmChainCollectiblesInventoryAction,
  clearEvmCollectiblesSearchAction,
  putEvmChainCollectiblesInventoryAction,
  putEvmCollectiblesSearchHitsAction,
  reconcileEvmCollectiblesOwnershipAction,
  setEvmCollectiblesInventoryLoadingAction,
  setEvmCollectiblesSearchLoadingAction
} from './actions';
import { evmCollectiblesInventoryInitialState, EvmCollectiblesInventoryState } from './state';

const accountChains = (state: EvmCollectiblesInventoryState, account: string) => {
  if (!state.byAccount[account]) state.byAccount[account] = {};

  return state.byAccount[account];
};

export const evmCollectiblesInventoryReducer = createReducer<EvmCollectiblesInventoryState>(
  evmCollectiblesInventoryInitialState,
  builder => {
    builder.addCase(setEvmCollectiblesInventoryLoadingAction, (state, { payload }) => {
      state.loading = payload;
    });

    builder.addCase(setEvmCollectiblesSearchLoadingAction, (state, { payload }) => {
      state.searchLoading = payload;
    });

    builder.addCase(clearEvmCollectiblesSearchAction, state => {
      state.searchQuery = undefined;
      state.searchHits = [];
      state.searchLoading = false;
    });

    builder.addCase(putEvmChainCollectiblesInventoryAction, (state, { payload }) => {
      accountChains(state, payload.account)[payload.chainId] = payload.inventory;
    });

    builder.addCase(appendEvmChainCollectiblesInventoryAction, (state, { payload }) => {
      const chain = accountChains(state, payload.account)[payload.chainId];
      if (!chain) return;

      const existingBySlug = new Map(chain.loaded.map(nft => [nft.slug, nft]));

      for (const nft of payload.loaded) {
        const existing = existingBySlug.get(nft.slug);
        if (!existing) {
          chain.loaded.push(nft);
          existingBySlug.set(nft.slug, nft);
          continue;
        }

        if (payload.replaceCollectionSlug && nft.collectionSlug) existing.collectionSlug = nft.collectionSlug;
        if (nft.balance) existing.balance = nft.balance;
      }

      if (payload.replacePageKey) chain.nftPageKey = payload.nftPageKey;
    });

    builder.addCase(reconcileEvmCollectiblesOwnershipAction, (state, { payload }) => {
      const chain = accountChains(state, payload.account)[payload.chainId];
      if (!chain) return;

      const previousBySlug = new Map(chain.loaded.map(nft => [nft.slug, nft]));
      const removeSlugs = new Set(payload.removeSlugs);
      const upsertBySlug = new Map(payload.upsert.map(nft => [nft.slug, nft]));
      chain.loaded = chain.loaded.filter(nft => !removeSlugs.has(nft.slug) && !upsertBySlug.has(nft.slug));

      for (const nft of payload.upsert) {
        const balance = nft.balance ?? previousBySlug.get(nft.slug)?.balance;
        chain.loaded.push(balance ? { ...nft, balance } : nft);
      }

      for (const update of payload.collectionCounts) {
        const collection = chain.collections.find(item => item.slug === update.slug);
        if (collection) collection.itemCount = update.itemCount;
      }
    });

    builder.addCase(putEvmCollectiblesSearchHitsAction, (state, { payload }) => {
      state.searchQuery = payload.query;
      state.searchHits = payload.hits;
      state.searchLoading = false;
    });
  }
);

const INVENTORY_PERSIST_BLACKLIST: Array<keyof EvmCollectiblesInventoryState> = [
  'loading',
  'searchLoading',
  'searchQuery',
  'searchHits'
];

export const evmCollectiblesInventoryPersistedReducer = persistReducer(
  {
    key: 'root.evmCollectiblesInventory',
    ...storageConfig,
    blacklist: INVENTORY_PERSIST_BLACKLIST
  },
  evmCollectiblesInventoryReducer
);
