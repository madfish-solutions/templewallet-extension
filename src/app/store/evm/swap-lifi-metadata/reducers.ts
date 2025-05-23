import { createReducer } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';

import { storageConfig } from 'lib/store';

import { putLifiEvmTokensMetadataAction, putLifiEvmTokensMetadataLoadingAction } from './actions';
import { lifiEvmTokensMetadataInitialState, LifiEvmTokensMetadataState } from './state';

const lifiEvmTokensMetadataReducer = createReducer<LifiEvmTokensMetadataState>(
  lifiEvmTokensMetadataInitialState,
  builder => {
    builder.addCase(putLifiEvmTokensMetadataAction, ({ metadataRecord }, { payload }) => {
      const { chainId, records } = payload;

      if (!metadataRecord[chainId]) metadataRecord[chainId] = {};
      const chainTokensMetadata = metadataRecord[chainId];

      for (const slug of Object.keys(records)) {
        const metadata = records[slug];
        if (!metadata) continue;

        chainTokensMetadata[slug] = metadata;
      }
    });
    builder.addCase(putLifiEvmTokensMetadataLoadingAction, (state, { payload }) => {
      if (payload.isLoading !== undefined) {
        state.isLoading = payload.isLoading;
      }
      if (payload.error !== undefined) {
        state.error = payload.error;
      }
    });
  }
);

export const lifiEvmTokensMetadataPersistedReducer = persistReducer(
  {
    key: 'root.lifiEvmTokensMetadata',
    ...storageConfig
  },
  lifiEvmTokensMetadataReducer
);
