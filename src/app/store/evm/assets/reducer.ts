import { createReducer } from '@reduxjs/toolkit';

import { proceedLoadedEVMAssetsAction } from './actions';
import { EVMAssetsInitialState, EVMAssetsStateInterface } from './state';
import { getNewStoredAssetsRecord } from './utils';

export const evmAssetsReducer = createReducer<EVMAssetsStateInterface>(EVMAssetsInitialState, builder => {
  builder.addCase(proceedLoadedEVMAssetsAction, (state, { payload }) => {
    const { publicKeyHash, data } = payload;

    if (data.length === 0) return;

    if (state.tokens[publicKeyHash]) {
      delete state.tokens[publicKeyHash];
    }

    state.tokens = getNewStoredAssetsRecord(state.tokens, publicKeyHash, data);
  });
});
