import { createReducer } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';

import { MAX_SHOW_AGREEMENTS_COUNTER } from 'lib/constants';
import { storageConfig } from 'lib/store';

import {
  setAdsImpressionsLinkedAction,
  setAcceptedTermsVersionAction,
  setConversionTrackedAction,
  setIsAnalyticsEnabledAction,
  setOnRampPossibilityAction,
  setPendingReactivateAdsAction,
  setShowAgreementsCounterAction,
  setReferralLinksEnabledAction,
  setShouldShowTermsOfUseUpdateOverlayAction,
  setToastsContainerBottomShiftAction
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

  builder.addCase(setToastsContainerBottomShiftAction, (state, { payload }) => {
    state.toastsContainerBottomShift = payload;
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
