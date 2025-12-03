import { mockPersistedState } from 'lib/store';

import { StakeWithdrawalReadyNotificationsState } from './state';

export const mockStakeWithdrawalReadyNotificationsState = mockPersistedState<StakeWithdrawalReadyNotificationsState>({
  notified: {}
});
