import { createReducer } from '@reduxjs/toolkit';
import { enableMapSet } from 'immer';
import { persistReducer } from 'redux-persist';
import hardSet from 'redux-persist/lib/stateReconciler/hardSet';
import storage from 'redux-persist/lib/storage';

import { tokenToSlug } from 'lib/assets';
import { fromAssetSlug } from 'lib/assets/utils';
import { checkSizeOfLocalStorageEntryToSet } from 'lib/local-storage';
import { TokenMetadata } from 'lib/metadata';
import { buildTokenMetadataFromFetched } from 'lib/metadata/utils';
import { getPersistStorageKey, createTransformsBeforePersist, createTransformsBeforeHydrate } from 'lib/store';

import {
  putCollectiblesMetadataAction,
  loadCollectiblesMetadataAction,
  resetCollectiblesMetadataLoadingAction
} from './actions';
import { collectiblesMetadataInitialState, SliceState } from './state';

/** See: https://immerjs.github.io/immer/map-set */
enableMapSet();

const collectiblesMetadataReducer = createReducer(collectiblesMetadataInitialState, builder => {
  builder.addCase(putCollectiblesMetadataAction, (state, { payload: { records, resetLoading } }) => {
    for (const slug of Object.keys(records)) {
      const metadataRaw = records[slug];
      if (!metadataRaw) continue;
      const [address, id] = fromAssetSlug(slug);
      if (!id) continue;

      const metadata = buildTokenMetadataFromFetched(metadataRaw, address, id);

      state.records.delete(slug);
      state.records.set(slug, metadata);
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

export const collectiblesMetadataPersistedReducer = persistReducer<SliceState>(
  {
    key: PERSIST_KEY,
    storage,
    stateReconciler: hardSet,
    blacklist: ['isLoading'] as (keyof SliceState)[],
    transforms: [
      /*
        # Persistance. Applied in direct order
      */
      createTransformsBeforePersist<SliceState>({
        records: (recordsUntyped, originalState) => {
          // Converting `records` from `Map` to `Array`
          let records = Array.from(recordsUntyped.values());

          if (checkSizeOfLocalStorageEntryToSet(STORAGE_PERSIST_KEY, { ...originalState, records }))
            return records as unknown as typeof recordsUntyped;

          // Reducing slice size (if needed) to succesfully persist
          do {
            const slicingBy = records.length > 10 ? 10 : 1;
            records = records.slice(slicingBy, records.length);
          } while (
            records.length &&
            !checkSizeOfLocalStorageEntryToSet(STORAGE_PERSIST_KEY, { ...originalState, records })
          );

          return records as unknown as typeof recordsUntyped;
        }
      }),
      /*
        # Hydration. Applied in reverse order
      */
      createTransformsBeforeHydrate<SliceState>({
        // Converting `records` from `Array` back to `Map`
        records: subState => {
          const records = subState as unknown as TokenMetadata[];

          return new Map(records.map(meta => [tokenToSlug(meta), meta]));
        }
      })
    ]
  },
  collectiblesMetadataReducer
);
