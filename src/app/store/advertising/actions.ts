import { createAction } from '@reduxjs/toolkit';

import { AdvertisingPromotion } from 'lib/apis/temple';
import { createActions } from 'lib/store';

export const loadAdvertisingPromotionActions = createActions<void, AdvertisingPromotion | undefined, string>(
  'advertising/LOAD_PROMOTION'
);

export const skipAdvertisingPromotionAction = createAction<void>('advertising/SKIP_PROMOTION');
