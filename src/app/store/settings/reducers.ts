import { createReducer } from '@reduxjs/toolkit';

import {
  setIsAnalyticsEnabledAction,
  setOnRampPossibilityAction,
  toggleBalanceModeAction,
  turnOffAdsBannerAction
} from './actions';
import { SettingsState, settingsInitialState } from './state';

export const settingsReducer = createReducer<SettingsState>(settingsInitialState, builder => {
  builder.addCase(setIsAnalyticsEnabledAction, (state, { payload: isAnalyticsEnabled }) => ({
    ...state,
    isAnalyticsEnabled
  }));
  builder.addCase(toggleBalanceModeAction, (state, { payload }) => {
    state.balanceMode = payload;
  });
  builder.addCase(turnOffAdsBannerAction, state => ({
    ...state,
    isEnableAdsBanner: false
  }));
  builder.addCase(setOnRampPossibilityAction, (state, { payload: isOnRampPossibility }) => ({
    ...state,
    isOnRampPossibility
  }));
});
