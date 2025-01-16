import { mockPersistedState } from 'lib/store';

import type { PartnersPromotionState } from './state';

export const mockPartnersPromotionState = mockPersistedState<PartnersPromotionState>({
  shouldShowPromotion: true,
  promotionHidingTimestamps: {}
});
