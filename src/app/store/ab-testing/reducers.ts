import { createReducer } from '@reduxjs/toolkit';

import { getUserTestingGroupNameActions } from './actions';
import { ABTestingState, abTestingInitialState } from './state';

export const abTestingReducer = createReducer<ABTestingState>(abTestingInitialState, builder => {
  builder.addCase(getUserTestingGroupNameActions.success, (state, { payload: testingGroupName }) => ({
    ...state,
    groupName: testingGroupName
  }));
});
