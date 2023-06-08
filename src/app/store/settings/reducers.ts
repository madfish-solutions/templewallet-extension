import { createReducer } from '@reduxjs/toolkit';

import { setIsAnalyticsEnabledAction, turnOffAdsBannerAction, toggleBalanceModeAction } from './actions';
import { settingsInitialState, SettingsState } from './state';

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
});
