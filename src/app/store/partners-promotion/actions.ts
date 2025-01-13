import { createAction } from '@reduxjs/toolkit';

interface HidePromotionActionPayload {
  id: string;
  timestamp: number;
}

export const togglePartnersPromotionAction = createAction<boolean>('partnersPromo/TOGGLE_PARTNERS_PROMO');

export const hidePromotionAction = createAction<HidePromotionActionPayload>('advertising/PROMOTION_HIDING');
