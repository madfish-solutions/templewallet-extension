import { createReducer } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import hardSet from 'redux-persist/lib/stateReconciler/hardSet';

import { storageConfig } from 'lib/store';

import { setDealsEnabledAction, setDealsSnoozedUntilAction } from './actions';
import { dealsInitialState, DealsState } from './state';

const dealsReducer = createReducer(dealsInitialState, builder => {
  builder.addCase(setDealsEnabledAction, (state, { payload }) => {
    state.enabled = payload;
    state.snoozedUntil = 0;
  });

  builder.addCase(setDealsSnoozedUntilAction, (state, { payload }) => {
    state.snoozedUntil = payload;
  });
});

export const dealsPersistedReducer = persistReducer<DealsState>(
  {
    key: 'root.deals',
    ...storageConfig,
    stateReconciler: hardSet
  },
  dealsReducer
);
