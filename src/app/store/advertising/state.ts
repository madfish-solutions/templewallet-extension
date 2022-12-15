import { AdvertisingPromotion } from 'lib/apis/temple';
import { createEntity, LoadableEntityState } from 'lib/store';

export interface AdvertisingState {
  activePromotion: LoadableEntityState<AdvertisingPromotion | undefined>;
  lastSeenPromotionName?: string;
}

export const advertisingInitialState: AdvertisingState = {
  activePromotion: createEntity(undefined),
  lastSeenPromotionName: undefined
};
