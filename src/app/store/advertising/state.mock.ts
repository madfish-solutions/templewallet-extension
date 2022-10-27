import { advertisingPromotionMock } from '../../interfaces/advertising-promotion.mock';
import { createEntity } from '../create-entity';
import { AdvertisingState } from './state';

// ts-prune-ignore-next
export const mockAdvertisingState: AdvertisingState = {
  activePromotion: createEntity(advertisingPromotionMock)
};
