import { createReducer } from '@reduxjs/toolkit';

import { getUserTestingGroupName } from './actions';
import { ABTestingState, abTestingInitialState } from './state';

export const abTestingReducer = createReducer<ABTestingState>(abTestingInitialState, builder => {
  builder.addCase(getUserTestingGroupName.success, (state, { payload: testingGroupName }) => ({
    ...state,
    groupName: testingGroupName
  }));
});
