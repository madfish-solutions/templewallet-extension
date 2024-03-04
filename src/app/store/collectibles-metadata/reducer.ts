import { createReducer } from '@reduxjs/toolkit';
import { enableMapSet } from 'immer';
import { persistReducer } from 'redux-persist';
import hardSet from 'redux-persist/lib/stateReconciler/hardSet';

import { tokenToSlug, fromAssetSlug } from 'lib/assets';
import { TokenMetadata } from 'lib/metadata';
import { buildTokenMetadataFromFetched } from 'lib/metadata/utils';
import { storageConfig, createTransformsBeforePersist, createTransformsBeforeHydrate } from 'lib/store';

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

export const collectiblesMetadataPersistedReducer = persistReducer<SliceState>(
  {
    key: 'root.collectiblesMetadata',
    ...storageConfig,
    stateReconciler: hardSet,
    blacklist: ['isLoading'] as (keyof SliceState)[],
    transforms: [
      /*
        # Persistance. Applied in direct order
      */
      createTransformsBeforePersist<SliceState>({
        records: nonSerializibleRecords => {
          // Converting `records` from `Map` to `Array`
          const serializibleRecords = Array.from(nonSerializibleRecords.values());

          return serializibleRecords as unknown as typeof nonSerializibleRecords;
        }
      }),
      /*
        # Hydration. Applied in reverse order
      */
      createTransformsBeforeHydrate<SliceState>({
        // Converting `records` from `Array` back to `Map`
        records: subState => {
          const serializibleRecords = subState as unknown as TokenMetadata[];

          return new Map(serializibleRecords.map(meta => [tokenToSlug(meta), meta]));
        }
      })
    ]
  },
  collectiblesMetadataReducer
);
