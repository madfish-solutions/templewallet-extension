import { createReducer } from '@reduxjs/toolkit';

import { setStakeWithdrawalReadyNotified } from './actions';
import { StakeWithdrawalReadyNotificationsState, stakeWithdrawalReadyNotificationsInitialState } from './state';

export const stakeWithdrawalReadyNotificationsReducer = createReducer<StakeWithdrawalReadyNotificationsState>(
  stakeWithdrawalReadyNotificationsInitialState,
  builder => {
    builder.addCase(setStakeWithdrawalReadyNotified, (state, { payload }) => {
      const { chainId, address, notified } = payload;

      if (!state.notified[chainId]) state.notified[chainId] = {};
      state.notified[chainId][address] = notified;
    });
  }
);
