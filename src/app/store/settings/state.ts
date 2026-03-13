import { nanoid } from '@reduxjs/toolkit';

import { IS_MISES_BROWSER } from 'lib/env';

type ChainAssetSlug = string;

export interface SettingsState {
  userId: string;
  isAnalyticsEnabled: boolean;
  pendingReactivateAds: boolean;
  adsImpressionsLinked: boolean;
  /** Now only used for Temple referral link replacement (TakeAds replacement removed, replaced by merchant offers popup) */
  referralLinksEnabled: boolean;
  isTestnetModeEnabled: boolean;
  onRampAsset: ChainAssetSlug | null;
  onRampTitle?: string;
  favoriteTokens: string[];
  /** @deprecated */
  isOnRampPossibility?: boolean;
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
  pendingReactivateAds: false,
  adsImpressionsLinked: false,
  referralLinksEnabled: IS_MISES_BROWSER,
  isTestnetModeEnabled: false,
  onRampAsset: null,
  favoriteTokens: []
};
