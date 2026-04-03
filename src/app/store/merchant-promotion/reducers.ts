import { createReducer } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import hardSet from 'redux-persist/lib/stateReconciler/hardSet';

import { storageConfig } from 'lib/store';

import { setMerchantPromotionEnabledAction, setMerchantPromotionSnoozedUntilAction } from './actions';
import { merchantPromotionInitialState, MerchantPromotionState } from './state';

const merchantPromotionReducer = createReducer(merchantPromotionInitialState, builder => {
  builder.addCase(setMerchantPromotionEnabledAction, (state, { payload }) => {
    state.enabled = payload;
    state.snoozedUntil = 0;
  });

  builder.addCase(setMerchantPromotionSnoozedUntilAction, (state, { payload }) => {
    state.snoozedUntil = payload;
  });
});

export const merchantPromotionPersistedReducer = persistReducer<MerchantPromotionState>(
  {
    key: 'root.merchantPromotion',
    ...storageConfig,
    stateReconciler: hardSet
  },
  merchantPromotionReducer
);
