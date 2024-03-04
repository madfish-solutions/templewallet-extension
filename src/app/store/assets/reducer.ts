import { createReducer } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';

import { toTokenSlug } from 'lib/assets';
import { storageConfig, createTransformsBeforePersist } from 'lib/store';

import {
  loadAccountTokensActions,
  loadAccountCollectiblesActions,
  loadTokensWhitelistActions,
  setTokenStatusAction,
  setCollectibleStatusAction,
  putTokensAsIsAction,
  putCollectiblesAsIsAction,
  loadTokensScamlistActions
} from './actions';
import { initialState, SliceState } from './state';
import { getAccountAssetsStoreKey } from './utils';

const assetsReducer = createReducer<SliceState>(initialState, builder => {
  builder.addCase(loadAccountTokensActions.submit, state => {
    state.tokens.isLoading = true;
    delete state.tokens.error;
  });

  builder.addCase(loadAccountTokensActions.fail, (state, { payload }) => {
    state.tokens.isLoading = false;
    state.tokens.error = payload ? String(payload) : 'unknown';
  });

  builder.addCase(loadAccountTokensActions.success, (state, { payload }) => {
    state.tokens.isLoading = false;
    delete state.tokens.error;

    const { account, chainId, slugs } = payload;

    const data = state.tokens.data;
    const key = getAccountAssetsStoreKey(account, chainId);

    if (!data[key]) data[key] = {};
    const tokens = data[key];

    for (const slug of slugs) {
      const stored = tokens[slug];
      if (!stored) tokens[slug] = { status: 'idle' };
    }
  });

  builder.addCase(loadAccountCollectiblesActions.submit, state => {
    state.collectibles.isLoading = true;
    delete state.collectibles.error;
  });

  builder.addCase(loadAccountCollectiblesActions.fail, (state, { payload }) => {
    state.collectibles.isLoading = false;
    state.collectibles.error = payload.code ? String(payload.code) : 'unknown';
  });

  builder.addCase(loadAccountCollectiblesActions.success, (state, { payload }) => {
    state.collectibles.isLoading = false;
    delete state.collectibles.error;

    const { account, chainId, slugs } = payload;

    const data = state.collectibles.data;
    const key = getAccountAssetsStoreKey(account, chainId);

    if (!data[key]) data[key] = {};
    const collectibles = data[key];

    // Removing no-longer owned collectibles (if not 'idle' or added manually)
    for (const [slug, stored] of Object.entries(collectibles)) {
      if (stored.manual || stored.status !== 'idle') continue;

      if (!slugs.includes(slug)) delete collectibles[slug];
    }

    for (const slug of slugs) {
      const stored = collectibles[slug];
      if (!stored) collectibles[slug] = { status: 'idle' };
    }
  });

  builder.addCase(setTokenStatusAction, (state, { payload: { account, chainId, slug, status } }) => {
    const records = state.tokens.data;
    const key = getAccountAssetsStoreKey(account, chainId);
    const token = records[key]?.[slug];

    if (token) token.status = status;
  });

  builder.addCase(setCollectibleStatusAction, (state, { payload: { account, chainId, slug, status } }) => {
    const records = state.collectibles.data;
    const key = getAccountAssetsStoreKey(account, chainId);
    const collectible = records[key]?.[slug];

    if (collectible) collectible.status = status;
  });

  builder.addCase(putTokensAsIsAction, (state, { payload }) => {
    const records = state.tokens.data;

    for (const asset of payload) {
      const { slug, account, chainId, status, manual } = asset;
      const key = getAccountAssetsStoreKey(account, chainId);
      if (!records[key]) records[key] = {};
      records[key][slug] = { status, manual };
    }
  });

  builder.addCase(putCollectiblesAsIsAction, (state, { payload }) => {
    const records = state.collectibles.data;

    for (const asset of payload) {
      const { slug, account, chainId, status, manual } = asset;
      const key = getAccountAssetsStoreKey(account, chainId);
      if (!records[key]) records[key] = {};
      records[key][slug] = { status, manual };
    }
  });

  builder.addCase(loadTokensWhitelistActions.submit, state => {
    state.mainnetWhitelist.isLoading = true;
    delete state.mainnetScamlist.error;
  });

  builder.addCase(loadTokensWhitelistActions.fail, (state, { payload }) => {
    state.mainnetWhitelist.isLoading = false;
    state.mainnetWhitelist.error = payload ? String(payload) : 'unknown';
  });

  builder.addCase(loadTokensWhitelistActions.success, (state, { payload }) => {
    state.mainnetWhitelist.isLoading = false;
    delete state.mainnetWhitelist.error;

    for (const token of payload) {
      if (token.contractAddress === 'tez') continue;
      const slug = toTokenSlug(token.contractAddress, token.fa2TokenId);
      if (!state.mainnetWhitelist.data.includes(slug)) state.mainnetWhitelist.data.push(slug);
    }
  });

  builder.addCase(loadTokensScamlistActions.submit, state => {
    state.mainnetScamlist.isLoading = true;
    delete state.mainnetScamlist.error;
  });

  builder.addCase(loadTokensScamlistActions.fail, (state, { payload }) => {
    state.mainnetScamlist.isLoading = false;
    state.mainnetScamlist.error = payload ? String(payload) : 'unknown';
  });

  builder.addCase(loadTokensScamlistActions.success, (state, { payload }) => {
    state.mainnetScamlist.isLoading = false;
    delete state.mainnetScamlist.error;

    state.mainnetScamlist.data = payload;
  });
});

export const assetsPersistedReducer = persistReducer<SliceState>(
  {
    key: 'root.assets',
    ...storageConfig,
    transforms: [
      createTransformsBeforePersist<SliceState>({
        tokens: entry => ({ ...entry, isLoading: false }),
        collectibles: entry => ({ ...entry, isLoading: false }),
        mainnetWhitelist: entry => ({ ...entry, isLoading: false }),
        mainnetScamlist: entry => ({ ...entry, isLoading: false })
      })
    ]
  },
  assetsReducer
);
