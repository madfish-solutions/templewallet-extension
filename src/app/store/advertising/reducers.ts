import { createReducer } from '@reduxjs/toolkit';

import { createEntity } from 'lib/store';

import { loadAdvertisingPromotionActions, skipAdvertisingPromotionAction } from './actions';
import { advertisingInitialState, AdvertisingState } from './state';

export const advertisingReducer = createReducer<AdvertisingState>(advertisingInitialState, builder => {
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
