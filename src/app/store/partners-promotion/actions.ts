import { createAction } from '@reduxjs/toolkit';

interface HidePromotionActionPayload {
  id: string;
  timestamp: number;
}

interface AdsSurfacesEnabledPayload {
  inWallet?: boolean;
  inBrowser?: boolean;
  aiChat?: boolean;
}

export const togglePartnersPromotionAction = createAction<boolean>('partnersPromo/TOGGLE_PARTNERS_PROMO');

export const setAdsSurfacesEnabledAction = createAction<AdsSurfacesEnabledPayload>(
  'partnersPromo/SET_ADS_SURFACES_ENABLED'
);

export const hidePromotionAction = createAction<HidePromotionActionPayload>('advertising/PROMOTION_HIDING');
