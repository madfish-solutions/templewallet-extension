import { createReducer } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import hardSet from 'redux-persist/lib/stateReconciler/hardSet';

import { AD_HIDING_TIMEOUT } from 'lib/constants';
import { storageConfig } from 'lib/store';

import { hidePromotionAction, togglePartnersPromotionAction } from './actions';
import { partnersPromotionInitialState, PartnersPromotionState } from './state';

const partnersPromotionReducer = createReducer(partnersPromotionInitialState, builder => {
  builder.addCase(togglePartnersPromotionAction, (state, { payload }) => {
    state.shouldShowPromotion = payload;
    state.promotionHidingTimestamps = {};
  });

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

export const partnersPromotionPersistedReducer = persistReducer<PartnersPromotionState>(
  {
    key: 'root.partnersPromotion',
    ...storageConfig,
    stateReconciler: hardSet // (!) Do not use with `blacklist` - props become optional by type
  },
  partnersPromotionReducer
);
