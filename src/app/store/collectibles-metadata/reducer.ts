import { createReducer } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import hardSet from 'redux-persist/lib/stateReconciler/hardSet';
import storage from 'redux-persist/lib/storage';

import { tokenToSlug } from 'lib/assets';
import { fromAssetSlug } from 'lib/assets/utils';
import { checkSizeOfLocalStorageEntryToSet } from 'lib/local-storage';
import { buildTokenMetadataFromFetched } from 'lib/metadata/utils';
import { createTransformsBeforePersist, getPersistStorageKey } from 'lib/store';

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
      const [address, id] = fromAssetSlug(slug);
      if (!id) continue;
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
const STORAGE_PERSIST_KEY = getPersistStorageKey(PERSIST_KEY);

export const collectiblesMetadataPersistedReducer = persistReducer<CollectiblesMetadataState>(
  {
    key: PERSIST_KEY,
    storage,
    stateReconciler: hardSet,
    blacklist: ['isLoading'] as (keyof CollectiblesMetadataState)[],
    transforms: [
      createTransformsBeforePersist<CollectiblesMetadataState>({
        // Reducing slice size (if needed) to succesfully persist
        records: (records, state) => {
          if (checkSizeOfLocalStorageEntryToSet(STORAGE_PERSIST_KEY, state)) return records;

          do {
            const slicingBy = records.length > 10 ? 10 : 1;
            records = records.slice(0, records.length - slicingBy);
          } while (records.length && !checkSizeOfLocalStorageEntryToSet(STORAGE_PERSIST_KEY, { ...state, records }));

          return records;
        }
      })
    ]
  },
  collectiblesMetadataReducer
);
