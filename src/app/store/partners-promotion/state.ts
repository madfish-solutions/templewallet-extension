import { OptimalPromotionType } from 'lib/apis/optimal';
import { LoadableEntityState, createEntity } from 'lib/store';

import { mockPartnersPromotion } from './state.mock';

export interface PartnersPromotionState {
  promotion: LoadableEntityState<OptimalPromotionType>;
  shouldShowPromotion: boolean;
  promotionHidingTimestamps: Record<string, number>;
  lastReportedPageName?: string;
}

export const partnersPromotionInitialState: PartnersPromotionState = {
  promotion: createEntity(mockPartnersPromotion),
  shouldShowPromotion: false,
  promotionHidingTimestamps: {}
};
