import { createReducer } from '@reduxjs/toolkit';

import { toggleBalanceMode } from './actions';
import { balanceModeInitialState, BalanceModeState } from './state';

export const balanceModeReducer = createReducer<BalanceModeState>(balanceModeInitialState, builder => {
  builder.addCase(toggleBalanceMode, (state, { payload }) => {
    state.balanceMode = payload;
  });
});
