import { LoadableEntityState } from 'lib/store';

export interface PartnersPromotionState {
  /** @deprecated */
  promotion?: LoadableEntityState<{}>;
  /**
   * @deprecated Replaced by inWalletAdsEnabled / inBrowserAdsEnabled / aiChatAdsEnabled.
   * Still present on pre-migration persisted state.
   */
  shouldShowPromotion?: boolean;
  inWalletAdsEnabled: boolean;
  inBrowserAdsEnabled: boolean;
  aiChatAdsEnabled: boolean;
  promotionHidingTimestamps: StringRecord<number>;
}

export const partnersPromotionInitialState: PartnersPromotionState = {
  inWalletAdsEnabled: false,
  inBrowserAdsEnabled: false,
  aiChatAdsEnabled: false,
  promotionHidingTimestamps: {}
};

export const isInBrowserAdsEnabled = (
  state: Pick<PartnersPromotionState, 'inWalletAdsEnabled' | 'inBrowserAdsEnabled'>
) => state.inWalletAdsEnabled && state.inBrowserAdsEnabled;

export const isAiChatAdsEnabled = (state: Pick<PartnersPromotionState, 'inWalletAdsEnabled' | 'aiChatAdsEnabled'>) =>
  state.inWalletAdsEnabled && state.aiChatAdsEnabled;

export const isInWalletAdsEnabledFromPersisted = (
  state: (Partial<PartnersPromotionState> & { shouldShowPromotion?: boolean }) | null | undefined
): boolean => {
  if (!state) return false;

  if (typeof state.inWalletAdsEnabled === 'boolean') return state.inWalletAdsEnabled;

  return state.shouldShowPromotion === true;
};
