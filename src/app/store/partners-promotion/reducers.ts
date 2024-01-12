import { createReducer } from '@reduxjs/toolkit';

import { AD_HIDING_TIMEOUT } from 'lib/constants';
import { createEntity } from 'lib/store';

import { hidePromotionAction, loadPartnersPromoAction, togglePartnersPromotionAction } from './actions';
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
  builder.addCase(togglePartnersPromotionAction, (state, { payload }) => ({
    ...state,
    shouldShowPromotion: payload,
    promotionHidingTimestamps: {}
  }));

  builder.addCase(hidePromotionAction, (state, { payload: { id: pathname, timestamp } }) => {
    const { promotionHidingTimestamps } = state;

    for (const promotionId in promotionHidingTimestamps) {
      if (promotionHidingTimestamps[promotionId] < timestamp - AD_HIDING_TIMEOUT * 2) {
        delete promotionHidingTimestamps[promotionId];
      }
    }

    promotionHidingTimestamps[pathname] = timestamp;
  });
});
