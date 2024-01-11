import { createAction } from '@reduxjs/toolkit';

import { OptimalPromotionType, OptimalPromoVariantEnum } from 'lib/apis/optimal';
import { createActions } from 'lib/store';

interface HidePromotionActionPayload {
  id: string;
  timestamp: number;
}

export const loadPartnersPromoAction = createActions<
  {
    optimalPromoVariantEnum: OptimalPromoVariantEnum;
    accountAddress: string;
  },
  OptimalPromotionType,
  string
>('partnersPromo/LOAD_PARTNERS');

export const togglePartnersPromotionAction = createAction<boolean>('partnersPromo/TOGGLE_PARTNERS_PROMO');

export const hidePromotionAction = createAction<HidePromotionActionPayload>('advertising/PROMOTION_HIDING');
