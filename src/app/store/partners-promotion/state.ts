import { LoadableEntityState } from 'lib/store';

export interface PartnersPromotionState {
  /** @deprecated */
  promotion?: LoadableEntityState<{}>;
  shouldShowPromotion: boolean;
  promotionHidingTimestamps: StringRecord<number>;
}

export const partnersPromotionInitialState: PartnersPromotionState = {
  shouldShowPromotion: false,
  promotionHidingTimestamps: {}
};
