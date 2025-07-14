import { IS_MISES_BROWSER } from 'lib/env';
import { mockPersistedState } from 'lib/store';

import { SettingsState } from './state';

export const mockSettingsState = mockPersistedState<SettingsState>({
  isAnalyticsEnabled: true,
  userId: '0',
  onRampAsset: null,
  isConversionTracked: false,
  pendingReactivateAds: false,
  adsImpressionsLinked: false,
  referralLinksEnabled: IS_MISES_BROWSER,
  isTestnetModeEnabled: false,
  favoriteTokens: []
});
