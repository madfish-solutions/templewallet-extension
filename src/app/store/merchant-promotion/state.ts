export interface MerchantPromotionState {
  enabled: boolean;
  snoozedUntil: number;
}

export const merchantPromotionInitialState: MerchantPromotionState = {
  enabled: false,
  snoozedUntil: 0
};
