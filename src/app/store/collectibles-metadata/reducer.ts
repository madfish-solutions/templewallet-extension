import { createReducer } from '@reduxjs/toolkit';
import { persistReducer, createTransform } from 'redux-persist';
import hardSet from 'redux-persist/lib/stateReconciler/hardSet';
import storage from 'redux-persist/lib/storage';

import { tokenToSlug } from 'lib/assets';
import { checkSizeOfLocalStorageEntryToSet } from 'lib/local-storage';
import { buildTokenMetadataFromFetched } from 'lib/metadata/utils';

import {
  putCollectiblesMetadataAction,
  loadCollectiblesMetadataAction,
  resetCollectiblesMetadataLoadingAction
} from './actions';
import { collectiblesMetadataInitialState, CollectiblesMetadataState } from './state';

const collectiblesMetadataReducer = createReducer(collectiblesMetadataInitialState, builder => {
  builder.addCase(putCollectiblesMetadataAction, (state, { payload: { records, resetLoading } }) => {
    for (const slug of Object.keys(records)) {
      const metadataRaw = records[slug];
      if (!metadataRaw) continue;
      const index = state.records.findIndex(m => tokenToSlug(m) === slug);
      const [address, id] = slug.split('_');
      const metadata = buildTokenMetadataFromFetched(metadataRaw, address, id);

      if (index !== -1) state.records.splice(index, 1);
      state.records.unshift(metadata);
    }

    if (resetLoading) state.isLoading = false;
  });

  builder.addCase(loadCollectiblesMetadataAction, state => {
    state.isLoading = true;
  });

  builder.addCase(resetCollectiblesMetadataLoadingAction, state => {
    state.isLoading = false;
  });
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
