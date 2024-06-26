import { mockPersistedState } from 'lib/store';

import { SettingsState } from './state';

export const mockSettingsState = mockPersistedState<SettingsState>({
  isAnalyticsEnabled: true,
  userId: '0',
  isOnRampPossibility: false,
  isConversionTracked: false,
  toastsContainerBottomShift: 0
});
