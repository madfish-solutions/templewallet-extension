import { createReducer } from '@reduxjs/toolkit';

import { loadTokensApyActions } from './actions';
import { dAppsInitialState, DAppsState } from './state';

export const dAppsReducer = createReducer<DAppsState>(dAppsInitialState, builder => {
  builder.addCase(loadTokensApyActions.success, (state, { payload: loadedRates }) => {
    const tokensApyRates = { ...state.tokensApyRates, ...loadedRates };

    return { ...state, tokensApyRates };
  });
});
