import { createReducer } from '@reduxjs/toolkit';

import { toTokenSlug } from 'lib/assets';

import { loadAccountTokensActions, loadTokensWhitelistActions, setTokenStatusAction } from './actions';
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
      const slug = toTokenSlug(token.contractAddress, token.fa2TokenId);
      if (!state.mainnetWhitelist.data.includes(slug)) state.mainnetWhitelist.data.push(slug);
    }
  });

  builder.addCase(setTokenStatusAction, (state, { payload: { account, chainId, slug, status } }) => {
    const tokens = state.tokens.data;
    const index = tokens.findIndex(t => t.account === account && t.chainId === chainId && t.slug === slug);
    const token = tokens[index] ?? { account, chainId, slug };

    token.status = status;
    tokens[index === -1 ? tokens.length : index] = token;
  });
});
