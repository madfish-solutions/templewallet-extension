import { createReducer } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';

import { storageConfig } from 'lib/store';

import {
  setAdsImpressionsLinkedAction,
  setConversionTrackedAction,
  setIsAnalyticsEnabledAction,
  setOnRampPossibilityAction,
  setPendingReactivateAdsAction,
  setReferralLinksEnabledAction,
  setIsTestnetModeEnabledAction
} from './actions';
import { SettingsState, settingsInitialState } from './state';

const settingsReducer = createReducer<SettingsState>(settingsInitialState, builder => {
  builder.addCase(setIsAnalyticsEnabledAction, (state, { payload }) => {
    state.isAnalyticsEnabled = payload;
  });

  builder.addCase(setOnRampPossibilityAction, (state, { payload }) => {
    state.onRampPossibility = payload;
  });

  builder.addCase(setConversionTrackedAction, state => {
    state.isConversionTracked = true;
  });

  builder.addCase(setPendingReactivateAdsAction, (state, { payload }) => {
    state.pendingReactivateAds = payload;
  });

  builder.addCase(setAdsImpressionsLinkedAction, state => {
    state.adsImpressionsLinked = true;
  });

  builder.addCase(setReferralLinksEnabledAction, (state, { payload }) => {
    state.referralLinksEnabled = payload;
  });

  builder.addCase(setIsTestnetModeEnabledAction, (state, { payload }) => {
    state.isTestnetModeEnabled = payload;
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
