import { createAction } from '@reduxjs/toolkit';

import { OptimalPromotionInterface } from 'lib/apis/optimal';
import { createActions } from 'lib/store';

export const loadPartnersPromoAction = createActions<void, OptimalPromotionInterface, string>(
  'partnersPromo/LOAD_PARTNERS_PROMOTION'
);

export const skipPartnersPromotionAction = createAction<string>('partnersPromo/SKIP_PARTNERS_PROMOTION');
