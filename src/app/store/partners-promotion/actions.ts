import { createAction } from '@reduxjs/toolkit';

import { OptimalPromotionType, OptimalPromoVariantEnum } from 'lib/apis/optimal';
import { createActions } from 'lib/store';

export const loadPartnersPromoAction = createActions<OptimalPromoVariantEnum, OptimalPromotionType, string>(
  'partnersPromo/LOAD_PARTNERS'
);

export const togglePartnersPromotionAction = createAction<boolean>('partnersPromo/TOGGLE_PARTNERS_PROMO');
