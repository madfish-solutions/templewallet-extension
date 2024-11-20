import { nanoid } from '@reduxjs/toolkit';

import { MAX_SHOW_AGREEMENTS_COUNTER, RECENT_TERMS_VERSION } from 'lib/constants';
import { IS_MISES_BROWSER } from 'lib/env';

export interface SettingsState {
  userId: string;
  isAnalyticsEnabled: boolean;
  isOnRampPossibility: boolean;
  isConversionTracked: boolean;
  pendingReactivateAds: boolean;
  adsImpressionsLinked: boolean;
  acceptedTermsVersion: number;
  referralLinksEnabled: boolean;
  showAgreementsCounter: number;
  shouldShowTermsOfUseUpdateOverlay: boolean;
  toastsContainerBottomShift: number;
  isTestnetModeEnabled: boolean;
  /** @deprecated */
  balanceMode?: 'fiat' | 'gas';
}

export const settingsInitialState: SettingsState = {
  userId: nanoid(),
  isAnalyticsEnabled: false,
  isOnRampPossibility: false,
  isConversionTracked: false,
  pendingReactivateAds: false,
  adsImpressionsLinked: false,
  acceptedTermsVersion: IS_MISES_BROWSER ? RECENT_TERMS_VERSION : 0,
  referralLinksEnabled: IS_MISES_BROWSER,
  showAgreementsCounter: IS_MISES_BROWSER ? MAX_SHOW_AGREEMENTS_COUNTER : 0,
  shouldShowTermsOfUseUpdateOverlay: true,
  toastsContainerBottomShift: 0,
  isTestnetModeEnabled: false
};
