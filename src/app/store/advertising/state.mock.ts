import { createEntity } from 'lib/store';

import { advertisingPromotionMock } from '../../interfaces/advertising-promotion.mock';
import { AdvertisingState } from './state';

export const mockAdvertisingState: AdvertisingState = {
  activePromotion: createEntity(advertisingPromotionMock)
};
