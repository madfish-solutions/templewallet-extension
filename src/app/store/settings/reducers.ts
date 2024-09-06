import { createReducer } from '@reduxjs/toolkit';

import { MAX_SHOW_AGREEMENTS_COUNTER } from 'lib/constants';

import {
  setAdsImpressionsLinkedAction,
  setAcceptedTermsVersionAction,
  setConversionTrackedAction,
  setIsAnalyticsEnabledAction,
  setOnRampPossibilityAction,
  setPendingReactivateAdsAction,
  setShowAgreementsCounterAction,
  setReferralLinksEnabledAction,
  toggleBalanceModeAction,
  setShouldShowTermsOfUseUpdateOverlayAction
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

  builder.addCase(setShowAgreementsCounterAction, state => {
    state.showAgreementsCounter = MAX_SHOW_AGREEMENTS_COUNTER;
  });

  builder.addCase(setShouldShowTermsOfUseUpdateOverlayAction, (state, { payload }) => {
    state.shouldShowTermsOfUseUpdateOverlay = payload;
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
