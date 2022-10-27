import { createReducer } from '@reduxjs/toolkit';

import { createEntity } from '../create-entity';
import { loadAdvertisingPromotionActions, skipAdvertisingPromotionAction } from './advertising-actions';
import { advertisingInitialState, AdvertisingState } from './advertising-state';

export const advertisingReducers = createReducer<AdvertisingState>(advertisingInitialState, builder => {
  builder.addCase(loadAdvertisingPromotionActions.submit, state => ({
    ...state,
    activePromotion: createEntity(state.activePromotion.data, true)
  }));
  builder.addCase(loadAdvertisingPromotionActions.success, (state, { payload: activePromotion }) => ({
    ...state,
    activePromotion: createEntity(activePromotion, false)
  }));
  builder.addCase(loadAdvertisingPromotionActions.fail, (state, { payload: error }) => ({
    ...state,
    activePromotion: createEntity(state.activePromotion.data, false, error)
  }));

  builder.addCase(skipAdvertisingPromotionAction, state => ({
    ...state,
    lastSeenPromotionName: state.activePromotion.data?.name
  }));
});
