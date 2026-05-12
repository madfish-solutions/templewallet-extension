import { mockPersistedState } from 'lib/store';

import type { MerchantPromotionState } from './state';

export const mockMerchantPromotionState = mockPersistedState<MerchantPromotionState>({
  enabled: false,
  snoozedUntil: 0
});
