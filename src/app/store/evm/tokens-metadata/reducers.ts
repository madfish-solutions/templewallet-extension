import { createReducer } from '@reduxjs/toolkit';

import { proceedLoadedEVMTokensMetadataAction } from './actions';
import { evmTokensMetadataInitialState, EVMTokensMetadataState } from './state';
import { getStoredTokensMetadataRecord } from './utils';

export const evmTokensMetadataReducer = createReducer<EVMTokensMetadataState>(
  evmTokensMetadataInitialState,
  builder => {
    builder.addCase(proceedLoadedEVMTokensMetadataAction, (state, { payload }) => {
      const { data } = payload;

      if (data.length === 0) return;

      state.metadataRecord = getStoredTokensMetadataRecord(state.metadataRecord, data);
    });
  }
);
