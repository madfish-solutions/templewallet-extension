import { createReducer } from '@reduxjs/toolkit';

import {
  setIsAnalyticsEnabledAction,
  setOnRampPossibilityAction,
  toggleBalanceModeAction,
  setAdsBannerVisibilityAction
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
  builder.addCase(setAdsBannerVisibilityAction, (state, { payload }) => ({
    ...state,
    isEnableAdsBanner: payload
  }));
  builder.addCase(setOnRampPossibilityAction, (state, { payload: isOnRampPossibility }) => ({
    ...state,
    isOnRampPossibility
  }));
});
