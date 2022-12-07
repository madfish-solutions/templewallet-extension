import { createEntity, LoadableEntityState } from 'lib/store';
import { AdvertisingPromotion } from 'lib/templewallet-api';

export interface AdvertisingState {
  activePromotion: LoadableEntityState<AdvertisingPromotion | undefined>;
  lastSeenPromotionName?: string;
}

export const advertisingInitialState: AdvertisingState = {
  activePromotion: createEntity(undefined),
  lastSeenPromotionName: undefined
};
