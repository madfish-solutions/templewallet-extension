import { createReducer } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';

import { toTokenSlug } from 'lib/assets';
import { storageConfig, createTransformsBeforePersist } from 'lib/store';

import {
  loadTokensWhitelistActions,
  setTezosTokenStatusAction,
  setTezosCollectibleStatusAction,
  putTokensAsIsAction,
  putCollectiblesAsIsAction,
  loadTokensScamlistActions,
  addAccountTokensAction,
  setAssetsIsLoadingAction,
  addAccountCollectiblesAction
} from './actions';
import { initialState, SliceState } from './state';
import { getAccountAssetsStoreKey } from './utils';

const assetsReducer = createReducer<SliceState>(initialState, builder => {
  builder.addCase(setAssetsIsLoadingAction, (state, { payload }) => {
    const assets = state[payload.type];
    assets.isLoading = payload.value;
    if (payload.resetError) delete assets.error;
  });

  builder.addCase(setTezosTokenStatusAction, (state, { payload: { account, chainId, slug, status } }) => {
    const records = state.tokens.data;
    const key = getAccountAssetsStoreKey(account, chainId);

    if (!records[key]) records[key] = {};
    const token = records[key][slug];

    if (token) token.status = status;
    else records[key][slug] = { status };
  });

  builder.addCase(setTezosCollectibleStatusAction, (state, { payload: { account, chainId, slug, status } }) => {
    const records = state.collectibles.data;
    const key = getAccountAssetsStoreKey(account, chainId);

    if (!records[key]) records[key] = {};
    const collectible = records[key][slug];

    if (collectible) collectible.status = status;
    else records[key][slug] = { status };
  });

  builder.addCase(addAccountTokensAction, (state, { payload: { account, chainId, slugs } }) => {
    const data = state.tokens.data;
    const key = getAccountAssetsStoreKey(account, chainId);

    if (!data[key]) data[key] = {};
    const tokens = data[key];

    for (const slug of slugs) {
      const stored = tokens[slug];
      if (!stored) tokens[slug] = { status: 'idle' };
    }
  });

  builder.addCase(addAccountCollectiblesAction, (state, { payload: { account, chainId, slugs } }) => {
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
