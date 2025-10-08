import { IS_MISES_BROWSER } from 'lib/env';

import { SettingsState } from './state';

export const mockSettingsState: SettingsState = {
  isAnalyticsEnabled: true,
  userId: '0',
  onRampAsset: null,
  pendingReactivateAds: false,
  adsImpressionsLinked: false,
  referralLinksEnabled: IS_MISES_BROWSER,
  isTestnetModeEnabled: false,
  favoriteTokens: []
};
