import { createReducer } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';

import { storageConfig, createEntity } from 'lib/store';

import { loadCollectiblesDetailsActions } from './actions';
import { collectiblesInitialState, CollectiblesState } from './state';

/** In seconds // TTL = Time To Live */
const ADULT_FLAG_TTL = 3 * 60 * 60;

const collectiblesReducer = createReducer<CollectiblesState>(collectiblesInitialState, builder => {
  builder.addCase(loadCollectiblesDetailsActions.submit, state => {
    state.details.isLoading = true;
  });

  builder.addCase(loadCollectiblesDetailsActions.success, (state, { payload }) => {
    const { details: detailsRecord, timestamp } = payload;

    const adultFlags = { ...state.adultFlags };
    const timestampInSeconds = Math.round(timestamp / 1_000);

    // Removing expired flags
    for (const [slug, { ts }] of Object.entries(adultFlags)) {
      if (ts + ADULT_FLAG_TTL < timestampInSeconds) delete adultFlags[slug];
    }

    for (const [slug, details] of Object.entries(detailsRecord)) {
      if (details) {
        adultFlags[slug] = { val: details.isAdultContent, ts: timestampInSeconds };
      }
    }

    return {
      ...state,
      details: createEntity({ ...state.details.data, ...detailsRecord }),
      adultFlags
    };
  });

  builder.addCase(loadCollectiblesDetailsActions.fail, (state, { payload }) => {
    state.details.isLoading = false;
    state.details.error = payload;
  });
});

export const collectiblesPersistedReducer = persistReducer(
  {
    key: 'root.collectibles',
    ...storageConfig,
    whitelist: ['adultFlags'] as (keyof CollectiblesState)[]
  },
  collectiblesReducer
);
