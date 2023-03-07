import { createReducer } from '@reduxjs/toolkit';

import { createEntity } from 'lib/store';

import { loadPartnersPromoAction, skipPartnersPromotionAction } from './actions';
import { partnersPromotionInitialState } from './state';

export const partnersPromotionRucer = createReducer(partnersPromotionInitialState, builder => {
  builder.addCase(loadPartnersPromoAction.submit, state => ({
    ...state,
    promotion: createEntity(state.promotion.data, true)
  }));
  builder.addCase(loadPartnersPromoAction.success, (state, { payload }) => ({
    ...state,
    promotion: createEntity(payload, false)
  }));
  builder.addCase(loadPartnersPromoAction.fail, (state, { payload }) => ({
    ...state,
    promotion: createEntity(state.promotion.data, false, payload)
  }));
  builder.addCase(skipPartnersPromotionAction, (state, { payload }) => ({
    ...state,
    seenPromotionIds: [...state.seenPromotionIds, payload]
  }));
});
