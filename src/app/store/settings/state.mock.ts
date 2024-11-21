import { MAX_SHOW_AGREEMENTS_COUNTER, RECENT_TERMS_VERSION } from 'lib/constants';
import { IS_MISES_BROWSER } from 'lib/env';
import { mockPersistedState } from 'lib/store';

import { SettingsState } from './state';

export const mockSettingsState = mockPersistedState<SettingsState>({
  isAnalyticsEnabled: true,
  userId: '0',
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
});
