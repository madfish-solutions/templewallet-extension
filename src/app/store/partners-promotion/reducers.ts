import { createReducer } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import hardSet from 'redux-persist/lib/stateReconciler/hardSet';

import { AD_HIDING_TIMEOUT } from 'lib/constants';
import { storageConfig } from 'lib/store';

import { hidePromotionAction, setAdsSurfacesEnabledAction, togglePartnersPromotionAction } from './actions';
import { migratePartnersPromotionPersist, PARTNERS_PROMOTION_PERSIST_VERSION } from './migrate';
import { partnersPromotionInitialState, PartnersPromotionState } from './state';

const partnersPromotionReducer = createReducer(partnersPromotionInitialState, builder => {
  builder.addCase(togglePartnersPromotionAction, (state, { payload }) => {
    state.inWalletAdsEnabled = payload;
    state.inBrowserAdsEnabled = payload;
    state.aiChatAdsEnabled = payload;
    // Preventing a later persist from writing the legacy flag
    delete state.shouldShowPromotion;
    state.promotionHidingTimestamps = {};
  });

  builder.addCase(setAdsSurfacesEnabledAction, (state, { payload }) => {
    if (payload.inWallet !== undefined) state.inWalletAdsEnabled = payload.inWallet;
    if (payload.inBrowser !== undefined) state.inBrowserAdsEnabled = payload.inBrowser;
    if (payload.aiChat !== undefined) state.aiChatAdsEnabled = payload.aiChat;
    if (!state.inWalletAdsEnabled) {
      state.inBrowserAdsEnabled = false;
      state.aiChatAdsEnabled = false;
    }
    delete state.shouldShowPromotion;
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
    version: PARTNERS_PROMOTION_PERSIST_VERSION,
    ...storageConfig,
    migrate: migratePartnersPromotionPersist,
    stateReconciler: hardSet // (!) Do not use with `blacklist` - props become optional by type
  },
  partnersPromotionReducer
);
