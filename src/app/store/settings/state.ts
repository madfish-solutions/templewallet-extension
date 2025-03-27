import { nanoid } from '@reduxjs/toolkit';

import { IS_MISES_BROWSER } from 'lib/env';

export interface SettingsState {
  userId: string;
  isAnalyticsEnabled: boolean;
  isOnRampPossibility: boolean;
  isConversionTracked: boolean;
  pendingReactivateAds: boolean;
  adsImpressionsLinked: boolean;
  referralLinksEnabled: boolean;
  toastsContainerBottomShift: number;
  isTestnetModeEnabled: boolean;
  /** @deprecated */
  acceptedTermsVersion?: number;
  /** @deprecated */
  showAgreementsCounter?: number;
  /** @deprecated */
  shouldShowTermsOfUseUpdateOverlay?: boolean;
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
  referralLinksEnabled: IS_MISES_BROWSER,
  toastsContainerBottomShift: 0,
  isTestnetModeEnabled: false
};
