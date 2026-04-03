import { createAction } from '@reduxjs/toolkit';

export const setMerchantPromotionEnabledAction = createAction<boolean>('merchantPromotion/SET_ENABLED');

export const setMerchantPromotionSnoozedUntilAction = createAction<number>('merchantPromotion/SET_SNOOZED_UNTIL');
