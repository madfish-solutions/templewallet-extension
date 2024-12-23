export interface PartnersPromotionState {
  shouldShowPromotion: boolean;
  promotionHidingTimestamps: StringRecord<number>;
}

export const partnersPromotionInitialState: PartnersPromotionState = {
  shouldShowPromotion: false,
  promotionHidingTimestamps: {}
};
