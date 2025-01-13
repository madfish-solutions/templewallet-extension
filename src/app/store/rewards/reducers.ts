import { createReducer } from '@reduxjs/toolkit';

import { createEntity } from 'lib/store';

import { loadManyMonthsRewardsActions, loadTodayRewardsActions } from './actions';
import { rewardsInitialState, RewardsState } from './state';

export const rewardsReducer = createReducer<RewardsState>(rewardsInitialState, builder => {
  builder.addCase(loadTodayRewardsActions.submit, (state, { payload }) => {
    const { account } = payload;
    state.rpForToday[account] = createEntity(state.rpForToday[account]?.data, true);
  });
  builder.addCase(loadTodayRewardsActions.success, (state, { payload }) => {
    const { account, value } = payload;
    state.rpForToday[account] = createEntity(value);
  });
  builder.addCase(loadTodayRewardsActions.fail, (state, { payload }) => {
    const { account, error } = payload;
    state.rpForToday[account] = createEntity(state.rpForToday[account]?.data, false, error);
  });

  builder.addCase(loadManyMonthsRewardsActions.submit, (state, { payload }) => {
    const { account } = payload;
    state.rpForMonths[account] = createEntity(state.rpForMonths[account]?.data, true);
  });
  builder.addCase(loadManyMonthsRewardsActions.success, (state, { payload }) => {
    const { account, values, firstActivityDate } = payload;
    state.rpForMonths[account] = createEntity(Object.assign({}, state.rpForMonths[account]?.data, values));
    state.firstActivityDates[account] = firstActivityDate;
  });
  builder.addCase(loadManyMonthsRewardsActions.fail, (state, { payload }) => {
    const { account, error } = payload;
    state.rpForMonths[account] = createEntity(state.rpForMonths[account]?.data, false, error);
  });
});
