import { createReducer } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';

import { storageConfig } from 'lib/store';

import {
  putLifiConnectedEvmTokensMetadataAction,
  putLifiEnabledNetworksEvmTokensCatalogueAction,
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
    builder.addCase(putLifiEnabledNetworksEvmTokensCatalogueAction, (state, { payload }) => {
      const { recordsByChainId, timestamp } = payload;

      for (const [chainIdStr, records] of Object.entries(recordsByChainId)) {
        const chainId = Number(chainIdStr);
        state.enabledChainsTokensMetadataRecord[chainId] = {};

        for (const slug of Object.keys(records)) {
          const metadata = records[slug];
          if (!metadata) continue;

          state.enabledChainsTokensMetadataRecord[chainId][slug] = metadata;
        }
      }

      state.catalogueFetchedAt = timestamp;
    });
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
    blacklist: ['isLoading', 'error', 'connectedTokensMetadataRecord'],
    ...storageConfig
  },
  lifiEvmTokensMetadataReducer
);
