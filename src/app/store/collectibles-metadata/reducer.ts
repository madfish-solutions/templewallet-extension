import { createReducer } from '@reduxjs/toolkit';
import { persistReducer, createTransform } from 'redux-persist';
import hardSet from 'redux-persist/lib/stateReconciler/hardSet';
import storage from 'redux-persist/lib/storage';
// import { omit, pick } from 'lodash';

import { tokenToSlug } from 'lib/assets';
import { checkSizeOfLocalStorageEntryToSet } from 'lib/local-storage';
import { buildTokenMetadataFromFetched } from 'lib/metadata/utils';

import {
  addCollectiblesMetadataAction,
  addCollectiblesMetadataOfFetchedAction,
  putCollectiblesMetadataAction,
  loadCollectiblesMetadataAction,
  resetCollectiblesMetadataLoadingAction
} from './actions';
import { collectiblesMetadataInitialState, CollectiblesMetadataState } from './state';

const collectiblesMetadataReducer = createReducer(collectiblesMetadataInitialState, builder => {
  builder.addCase(addCollectiblesMetadataAction, (state, { payload }) => {
    for (const metadata of payload) {
      const slug = tokenToSlug(metadata);
      const index = state.records.findIndex(m => tokenToSlug(m) === slug);
      if (index === -1) state.records.unshift(metadata);
    }
  });

  builder.addCase(addCollectiblesMetadataOfFetchedAction, (state, { payload }) => {
    for (const slug of Object.keys(payload)) {
      const index = state.records.findIndex(m => tokenToSlug(m) === slug);
      if (index === -1) {
        const [address, id] = slug.split('_');
        const metadata = buildTokenMetadataFromFetched(payload[slug]!, address, Number(id));
        state.records.unshift(metadata);
      }
    }
  });

  builder.addCase(putCollectiblesMetadataAction, (state, { payload: tokensMetadata }) => {
    for (const metadata of tokensMetadata) {
      const slug = tokenToSlug(metadata);
      const index = state.records.findIndex(m => tokenToSlug(m) === slug);
      if (index !== -1) state.records.splice(index, 1);
      state.records.unshift(metadata);
    }

    state.isLoading = false;
  });

  builder.addCase(loadCollectiblesMetadataAction, state => {
    state.isLoading = true;
  });

  builder.addCase(resetCollectiblesMetadataLoadingAction, state => {
    state.isLoading = false;
  });

  // builder.addCase(refreshTokensMetadataAction, (state, { payload }) => {
  //   const keysToRefresh = ['artifactUri', 'displayUri'] as const;
  //   for (const metadata of payload) {
  //     const slug = tokenToSlug(metadata);
  //     const current = state.metadataRecord[slug];
  //     if (!current) continue;
  //     state.metadataRecord[slug] = {
  //       ...omit(current, keysToRefresh),
  //       ...pick(metadata, keysToRefresh)
  //     };
  //   }
  // });
});

const PERSIST_KEY = 'root.collectiblesMetadata';

export const collectiblesMetadataPersistedReducer = persistReducer<CollectiblesMetadataState>(
  {
    key: PERSIST_KEY,
    storage,
    stateReconciler: hardSet,
    transforms: [
      // Reducing slice size (if needed) to succesfully persist
      createTransform<CollectiblesMetadataState, CollectiblesMetadataState>(inboundState => {
        if (checkSizeOfLocalStorageEntryToSet(PERSIST_KEY, inboundState)) return inboundState;

        let records = inboundState.records;
        do {
          records = records.slice(0, records.length - 1);
        } while (records.length && !checkSizeOfLocalStorageEntryToSet(PERSIST_KEY, { ...inboundState, records }));

        return { ...inboundState, records };
      }, null)
    ]
  },
  collectiblesMetadataReducer
);
