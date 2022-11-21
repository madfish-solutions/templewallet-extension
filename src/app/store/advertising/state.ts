import { AdvertisingPromotion } from 'lib/templewallet-api';

import { createEntity } from '../create-entity';
import { LoadableEntityState } from '../types';

export interface AdvertisingState {
  activePromotion: LoadableEntityState<AdvertisingPromotion | undefined>;
  lastSeenPromotionName?: string;
}

export const advertisingInitialState: AdvertisingState = {
  activePromotion: createEntity(undefined),
  lastSeenPromotionName: undefined
};
