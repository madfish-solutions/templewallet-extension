import { createReducer } from '@reduxjs/toolkit';

import {
  setAdsImpressionsLinkedAction,
  setIsAnalyticsEnabledAction,
  setOnRampAssetAction,
  setPendingReactivateAdsAction,
  setReferralLinksEnabledAction,
  setIsTestnetModeEnabledAction,
  toggleFavoriteTokenAction
} from './actions';
import { SettingsState, settingsInitialState } from './state';

export const settingsReducer = createReducer<SettingsState>(settingsInitialState, builder => {
  builder.addCase(setIsAnalyticsEnabledAction, (state, { payload }) => {
    state.isAnalyticsEnabled = payload;
  });

  builder.addCase(setOnRampAssetAction, (state, { payload }) => {
    const { chainAssetSlug, title } = payload;
    state.onRampAsset = chainAssetSlug;
    state.onRampTitle = title;
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
  builder.addCase(toggleFavoriteTokenAction, (state, { payload: tokenSlug }) => {
    const newFavoriteTokens = new Set(state.favoriteTokens);
    if (newFavoriteTokens.has(tokenSlug)) {
      newFavoriteTokens.delete(tokenSlug);
    } else {
      newFavoriteTokens.add(tokenSlug);
    }
    state.favoriteTokens = Array.from(newFavoriteTokens);
  });
});
