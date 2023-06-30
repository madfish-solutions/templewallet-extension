import { OptimalPromotionType } from 'lib/apis/optimal';
import { LoadableEntityState, createEntity } from 'lib/store';

import { mockPartnersPromotion } from './state.mock';

export interface PartnersPromotionState {
  promotion: LoadableEntityState<OptimalPromotionType>;
  shouldShowPromotion: boolean;
}

export const partnersPromotionInitialState: PartnersPromotionState = {
  promotion: createEntity(mockPartnersPromotion),
  shouldShowPromotion: false
};
