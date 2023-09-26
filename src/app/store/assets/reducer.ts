import { createReducer } from '@reduxjs/toolkit';

import { toTokenSlug } from 'lib/assets';

import {
  loadAccountTokensActions,
  loadAccountCollectiblesActions,
  loadTokensWhitelistActions,
  setAssetStatusAction
} from './actions';
import { initialState, SliceState } from './state';

export const assetsReducer = createReducer<SliceState>(initialState, builder => {
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

  builder.addCase(loadAccountCollectiblesActions.submit, state => {
    state.collectibles.isLoading = true;
    delete state.collectibles.error;
  });

  builder.addCase(loadAccountCollectiblesActions.fail, (state, { payload }) => {
    state.collectibles.isLoading = false;
    state.collectibles.error = payload ? String(payload) : 'unknown';
  });

  builder.addCase(loadAccountCollectiblesActions.success, (state, { payload }) => {
    state.collectibles.isLoading = false;
    delete state.collectibles.error;

    const collectibles = state.collectibles.data;
    const { account, chainId, slugs } = payload;

    for (const slug of slugs) {
      if (!collectibles.some(t => t.slug === slug && t.chainId === chainId && t.account === account))
        collectibles.push({
          account,
          chainId,
          slug
        });
    }
  });

  builder.addCase(setAssetStatusAction, (state, { payload: { isCollectible, account, chainId, slug, status } }) => {
    const assets = state[isCollectible ? 'collectibles' : 'tokens'].data;
    const index = assets.findIndex(t => t.account === account && t.chainId === chainId && t.slug === slug);
    const token = assets[index] ?? { account, chainId, slug };

    token.status = status;
    assets[index === -1 ? assets.length : index] = token;
  });
});
