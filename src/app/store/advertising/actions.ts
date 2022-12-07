import { createAction } from '@reduxjs/toolkit';

import { createActions } from 'lib/store';
import { AdvertisingPromotion } from 'lib/templewallet-api';

export const loadAdvertisingPromotionActions = createActions<void, AdvertisingPromotion | undefined, string>(
  'advertising/LOAD_PROMOTION'
);

export const skipAdvertisingPromotionAction = createAction<void>('advertising/SKIP_PROMOTION');
