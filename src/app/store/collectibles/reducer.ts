import { createReducer } from '@reduxjs/toolkit';

import { createEntity } from 'lib/store';

import { loadCollectiblesDetailsActions } from './actions';
import { collectiblesInitialState, CollectiblesState } from './state';

export const collectiblesReducer = createReducer<CollectiblesState>(collectiblesInitialState, builder => {
  builder.addCase(loadCollectiblesDetailsActions.submit, state => {
    state.details.isLoading = true;
  });
  builder.addCase(loadCollectiblesDetailsActions.success, (state, { payload }) => ({
    ...state,
    details: createEntity(payload)
  }));
  builder.addCase(loadCollectiblesDetailsActions.fail, (state, { payload }) => {
    state.details.isLoading = false;
    state.details.error = payload;
  });
});
