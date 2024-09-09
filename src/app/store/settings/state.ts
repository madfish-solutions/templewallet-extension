import { nanoid } from '@reduxjs/toolkit';

import { MAX_SHOW_AGREEMENTS_COUNTER, RECENT_TERMS_VERSION } from 'lib/constants';
import { IS_MISES_BROWSER } from 'lib/env';

export enum BalanceMode {
  Fiat = 'fiat',
  Gas = 'gas'
}

export interface SettingsState {
  userId: string;
  isAnalyticsEnabled: boolean;
  balanceMode: BalanceMode;
  isOnRampPossibility: boolean;
  isConversionTracked: boolean;
  pendingReactivateAds: boolean;
  adsImpressionsLinked: boolean;
  acceptedTermsVersion: number;
  referralLinksEnabled: boolean;
  showAgreementsCounter: number;
  shouldShowTermsOfUseUpdateOverlay: boolean;
}

export const settingsInitialState: SettingsState = {
  userId: nanoid(),
  isAnalyticsEnabled: false,
  balanceMode: BalanceMode.Fiat,
  isOnRampPossibility: false,
  isConversionTracked: false,
  pendingReactivateAds: false,
  adsImpressionsLinked: false,
  acceptedTermsVersion: IS_MISES_BROWSER ? RECENT_TERMS_VERSION : 0,
  referralLinksEnabled: IS_MISES_BROWSER,
  showAgreementsCounter: IS_MISES_BROWSER ? MAX_SHOW_AGREEMENTS_COUNTER : 0,
  shouldShowTermsOfUseUpdateOverlay: true
};
