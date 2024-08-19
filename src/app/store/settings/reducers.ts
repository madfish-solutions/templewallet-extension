import { createReducer } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';

import { storageConfig } from 'lib/store';

import {
  setIsAnalyticsEnabledAction,
  setOnRampPossibilityAction,
  setConversionTrackedAction,
  setToastsContainerBottomShiftAction,
  setPendingReactivateAdsAction
} from './actions';
import { SettingsState, settingsInitialState } from './state';

const settingsReducer = createReducer<SettingsState>(settingsInitialState, builder => {
  builder.addCase(setIsAnalyticsEnabledAction, (state, { payload }) => {
    state.isAnalyticsEnabled = payload;
  });

  builder.addCase(setOnRampPossibilityAction, (state, { payload }) => {
    state.isOnRampPossibility = payload;
  });

  builder.addCase(setConversionTrackedAction, state => {
    state.isConversionTracked = true;
  });

  builder.addCase(setToastsContainerBottomShiftAction, (state, { payload }) => {
    state.toastsContainerBottomShift = payload;
  });

  builder.addCase(setPendingReactivateAdsAction, (state, { payload }) => {
    state.pendingReactivateAds = payload;
  });
});

export const settingsPersistedReducer = persistReducer(
  {
    key: 'root.settings',
    ...storageConfig,
    blacklist: ['toastsContainerBottomShift']
  },
  settingsReducer
);
