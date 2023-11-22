import { createReducer } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import hardSet from 'redux-persist/lib/stateReconciler/hardSet';
import storage from 'redux-persist/lib/storage';

import { toTokenSlug } from 'lib/assets';
import { createTransformsBeforePersist } from 'lib/store';

import {
  loadAccountTokensActions,
  loadAccountCollectiblesActions,
  loadTokensWhitelistActions,
  setTokenStatusAction,
  setCollectibleStatusAction,
  putTokensAsIsAction,
  putCollectiblesAsIsAction
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

    const tokens = state.tokens.data;
    const { account, chainId, slugs } = payload;

    for (const slug of slugs) {
      if (!tokens.some(t => t.slug === slug && t.chainId === chainId && t.account === account))
        tokens.push({
          account,
          chainId,
          slug
        });
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

    for (const slug of slugs) {
      if (!collectibles[slug]) collectibles[slug] = {};
    }
  });

  builder.addCase(setTokenStatusAction, (state, { payload: { account, chainId, slug, status } }) => {
    const tokens = state.tokens.data;
    const token = tokens.find(t => t.account === account && t.chainId === chainId && t.slug === slug);

    if (token) token.status = status;
  });

  builder.addCase(setCollectibleStatusAction, (state, { payload: { account, chainId, slug, status } }) => {
    const records = state.collectibles.data;
    const key = getAccountAssetsStoreKey(account, chainId);
    const collectible = records[key]?.[slug];

    if (collectible) collectible.status = status;
  });

  builder.addCase(putTokensAsIsAction, (state, { payload }) => {
    const data = state.tokens.data;

    for (const asset of payload) {
      const { slug, account, chainId } = asset;
      const index = data.findIndex(a => a.account === account && a.chainId === chainId && a.slug === slug);
      data[index === -1 ? data.length : index] = asset;
    }
  });

  builder.addCase(putCollectiblesAsIsAction, (state, { payload }) => {
    const records = state.collectibles.data;

    for (const asset of payload) {
      const { slug, account, chainId, status } = asset;
      const key = getAccountAssetsStoreKey(account, chainId);
      if (!records[key]) records[key] = {};
      records[key][slug] = { status };
    }
  });

  builder.addCase(loadTokensWhitelistActions.submit, state => {
    state.mainnetWhitelist.isLoading = true;
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
});

export const assetsPersistedReducer = persistReducer<SliceState>(
  {
    key: 'root.assets',
    storage,
    stateReconciler: hardSet,
    transforms: [
      createTransformsBeforePersist<SliceState>({
        tokens: entry => ({ ...entry, isLoading: false }),
        collectibles: entry => ({ ...entry, isLoading: false }),
        mainnetWhitelist: entry => ({ ...entry, isLoading: false })
      })
    ]
  },
  assetsReducer
);
