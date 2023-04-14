import { createAction } from '@reduxjs/toolkit';

import { OptimalPromotionInterface, OptimalPromoVariantEnum } from 'lib/apis/optimal';
import { createActions } from 'lib/store';

export const loadPartnersPromoAction = createActions<OptimalPromoVariantEnum, OptimalPromotionInterface, string>(
  'partnersPromo/LOAD_PARTNERS'
);

export const togglePartnersPromotionAction = createAction<boolean>('partnersPromo/TOGGLE_PARTNERS_PROMO');
