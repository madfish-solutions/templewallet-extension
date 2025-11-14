import { createReducer } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';

import { storageConfig } from 'lib/store';

import {
  putRoute3EvmTokensMetadataAction,
  put3RouteEvmTokensMetadataLoadingAction,
  set3RouteEvmMetadataLastFetchTimeAction
} from './actions';
import { route3EvmTokensMetadataInitialState, Route3EvmTokensMetadataState } from './state';

const route3EvmTokensMetadataReducer = createReducer<Route3EvmTokensMetadataState>(
  route3EvmTokensMetadataInitialState,
  builder => {
    builder.addCase(putRoute3EvmTokensMetadataAction, ({ metadataRecord }, { payload }) => {
      const { chainId, records } = payload;

      metadataRecord[chainId] = {};

      for (const slug of Object.keys(records)) {
        const metadata = records[slug];
        if (!metadata) continue;

        metadataRecord[chainId][slug] = metadata;
      }
    });
    builder.addCase(put3RouteEvmTokensMetadataLoadingAction, (state, { payload }) => {
      if (payload.isLoading !== undefined) {
        state.isLoading = payload.isLoading;
      }
      if (payload.error !== undefined) {
        state.error = payload.error;
      }
    });
    builder.addCase(set3RouteEvmMetadataLastFetchTimeAction, (state, action) => {
      state.lastFetchTime = action.payload;
    });
  }
);

export const route3EvmTokensMetadataPersistedReducer = persistReducer(
  {
    key: 'root.route3EvmTokensMetadata',
    blacklist: ['isLoading', 'error', 'metadataRecord'],
    ...storageConfig
  },
  route3EvmTokensMetadataReducer
);
