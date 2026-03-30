import { createReducer } from '@reduxjs/toolkit';
import { createMigrate, PersistedState, persistReducer } from 'redux-persist';

import { createEntity, storageConfig } from 'lib/store';

import { loadCollectiblesDetailsActions } from './actions';
import { collectiblesInitialState, CollectiblesState } from './state';
import { IS_DEV_ENV } from 'lib/env';
import { omit } from 'lodash';
import { WR_TOKEN_SLUG } from 'lib/assets/known-tokens';

/** In seconds // TTL = Time To Live */
const ADULT_FLAG_TTL = 3 * 60 * 60;

const collectiblesReducer = createReducer<CollectiblesState>(collectiblesInitialState, builder => {
  builder.addCase(loadCollectiblesDetailsActions.submit, state => {
    state.details.isLoading = true;
  });

  builder.addCase(loadCollectiblesDetailsActions.success, (state, { payload }) => {
    const { details: detailsRecord, timestamp } = payload;

    const timestampInSeconds = Math.round(timestamp / 1_000);

    // Removing expired flags
    for (const slug in state.adultFlags) {
      const { ts } = state.adultFlags[slug];
      if (ts + ADULT_FLAG_TTL < timestampInSeconds) delete state.adultFlags[slug];
    }

    for (const slug in detailsRecord) {
      const details = detailsRecord[slug];
      if (details) {
        state.adultFlags[slug] = { val: details.isAdultContent, ts: timestampInSeconds };
      }
      state.details.data[slug] = details;
    }

    state.details.isLoading = false;
    state.details.error = undefined;
  });

  builder.addCase(loadCollectiblesDetailsActions.fail, (state, { payload }) => {
    state.details.isLoading = false;
    state.details.error = payload;
  });
});

type TypedPersistedCollectiblesState = Exclude<PersistedState, undefined> &
  MakePropertiesOptional<CollectiblesState, 'adultFlags'>;

export const collectiblesPersistedReducer = persistReducer(
  {
    key: 'root.collectibles',
    ...storageConfig,
    whitelist: ['adultFlags'] as (keyof CollectiblesState)[],
    version: 2,
    migrate: createMigrate({
      '2': (persistedState: PersistedState) => {
        if (!persistedState) return persistedState;

        const state = persistedState as TypedPersistedCollectiblesState;

        return { ...state, details: createEntity(omit(state.details?.data ?? {}, WR_TOKEN_SLUG)) };
      }
    }, { debug: IS_DEV_ENV })
  },
  collectiblesReducer
);
