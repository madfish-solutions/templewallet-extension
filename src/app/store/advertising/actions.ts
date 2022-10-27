import { createAction } from '@reduxjs/toolkit';

import { AdvertisingPromotion } from 'lib/templewallet-api';

import { createActions } from '../create-actions';

export const loadAdvertisingPromotionActions = createActions<void, AdvertisingPromotion, string>(
  'advertising/LOAD_PROMOTION'
);

export const skipAdvertisingPromotionAction = createAction<void>('advertising/SKIP_PROMOTION');
