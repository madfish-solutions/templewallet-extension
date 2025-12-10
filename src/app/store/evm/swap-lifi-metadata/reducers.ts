import { createReducer } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';

import { storageConfig } from 'lib/store';

import {
  putLifiConnectedEvmTokensMetadataAction,
  putLifiEnabledNetworksEvmTokensMetadataAction,
  putLifiEvmTokensMetadataLoadingAction,
  putLifiSupportedChainIdsAction,
  setLifiMetadataLastFetchTimeAction
} from './actions';
import { lifiEvmTokensMetadataInitialState, LifiEvmTokensMetadataState } from './state';

const lifiEvmTokensMetadataReducer = createReducer<LifiEvmTokensMetadataState>(
  lifiEvmTokensMetadataInitialState,
  builder => {
    builder.addCase(putLifiConnectedEvmTokensMetadataAction, ({ connectedTokensMetadataRecord }, { payload }) => {
      const { chainId, records } = payload;

      connectedTokensMetadataRecord[chainId] = {};

      for (const slug of Object.keys(records)) {
        const metadata = records[slug];
        if (!metadata) continue;

        connectedTokensMetadataRecord[chainId][slug] = metadata;
      }
    });
    builder.addCase(
      putLifiEnabledNetworksEvmTokensMetadataAction,
      ({ enabledChainsTokensMetadataRecord }, { payload }) => {
        const { chainId, records } = payload;

        enabledChainsTokensMetadataRecord[chainId] = {};

        for (const slug of Object.keys(records)) {
          const metadata = records[slug];
          if (!metadata) continue;

          enabledChainsTokensMetadataRecord[chainId][slug] = metadata;
        }
      }
    );
    builder.addCase(putLifiEvmTokensMetadataLoadingAction, (state, { payload }) => {
      if (payload.isLoading !== undefined) {
        state.isLoading = payload.isLoading;
      }
      if (payload.error !== undefined) {
        state.error = payload.error;
      }
    });
    builder.addCase(setLifiMetadataLastFetchTimeAction, (state, action) => {
      state.lastFetchTime = action.payload;
    });
    builder.addCase(putLifiSupportedChainIdsAction, (state, action) => {
      state.supportedChainIds = action.payload;
    });
  }
);

export const lifiEvmTokensMetadataPersistedReducer = persistReducer(
  {
    key: 'root.lifiEvmTokensMetadata',
    blacklist: ['isLoading', 'error', 'connectedTokensMetadataRecord', 'enabledChainsTokensMetadataRecord'],
    ...storageConfig
  },
  lifiEvmTokensMetadataReducer
);
