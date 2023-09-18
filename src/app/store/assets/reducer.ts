import { createReducer } from '@reduxjs/toolkit';

import { loadAccountTokensActions, setTokenStatusToRemovedAction, toggleTokenStatusAction } from './actions';
import { initialState, SliceState } from './state';

export const assetsReducer = createReducer<SliceState>(initialState, builder => {
  builder.addCase(loadAccountTokensActions.submit, state => {
    state.tokens.isLoading = true;
    delete state.tokens.error;
  });

  builder.addCase(loadAccountTokensActions.fail, state => {
    state.tokens.isLoading = false;
    state.tokens.error = `Couldn't load account tokens`;
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

  builder.addCase(setTokenStatusToRemovedAction, (state, { payload: { account, chainId, slug } }) => {
    const tokens = state.tokens.data;
    const index = tokens.findIndex(t => t.account === account && t.chainId === chainId && t.slug === slug);
    const token = tokens[index] ?? { account, chainId, slug };

    token.status = 'removed';
    tokens[index === -1 ? tokens.length : index] = token;
  });

  builder.addCase(toggleTokenStatusAction, (state, { payload: { account, chainId, slug } }) => {
    const tokens = state.tokens.data;
    const index = tokens.findIndex(t => t.account === account && t.chainId === chainId && t.slug === slug);
    const token = tokens[index] ?? { account, chainId, slug };

    token.status = token.status === 'disabled' ? 'enabled' : 'disabled';
    tokens[index === -1 ? tokens.length : index] = token;
  });
});
