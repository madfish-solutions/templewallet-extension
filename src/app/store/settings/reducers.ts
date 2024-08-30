import { createReducer } from '@reduxjs/toolkit';

import {
  setAdsImpressionsLinkedAction,
  setAcceptedTermsVersionAction,
  setConversionTrackedAction,
  setIsAnalyticsEnabledAction,
  setOnRampPossibilityAction,
  setPendingReactivateAdsAction,
  setReferralLinksEnabledAction,
  toggleBalanceModeAction
} from './actions';
import { SettingsState, settingsInitialState } from './state';

export const settingsReducer = createReducer<SettingsState>(settingsInitialState, builder => {
  builder.addCase(setIsAnalyticsEnabledAction, (state, { payload: isAnalyticsEnabled }) => {
    state.isAnalyticsEnabled = isAnalyticsEnabled;
  });

  builder.addCase(toggleBalanceModeAction, (state, { payload }) => {
    state.balanceMode = payload;
  });

  builder.addCase(setOnRampPossibilityAction, (state, { payload: isOnRampPossibility }) => {
    state.isOnRampPossibility = isOnRampPossibility;
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

  builder.addCase(setAcceptedTermsVersionAction, (state, { payload }) => {
    state.acceptedTermsVersion = payload;
  });

  builder.addCase(setReferralLinksEnabledAction, (state, { payload }) => {
    state.referralLinksEnabled = payload;
  });
});
