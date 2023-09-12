import { combineReducers } from '@reduxjs/toolkit';

import { notificationsReducer } from 'lib/notifications';

import { abTestingReducer } from './ab-testing/reducers';
import { advertisingReducer } from './advertising/reducers';
import { balancesReducer } from './balances/reducers';
import { buyWithCreditCardReducer } from './buy-with-credit-card/reducers';
import { collectiblesPersistedReducer } from './collectibles/reducer';
import { currencyReducer } from './currency/reducers';
import { dAppsReducer } from './d-apps/reducers';
import { newsletterReducers } from './newsletter/newsletter-reducers';
import { partnersPromotionRucer } from './partners-promotion/reducers';
import { settingsReducer } from './settings/reducers';
import { swapReducer } from './swap/reducers';
import { tokensMetadataReducer } from './tokens-metadata/reducers';

const rootStateReducersMap = {
  settings: settingsReducer,
  advertising: advertisingReducer,
  currency: currencyReducer,
  notifications: notificationsReducer,
  dApps: dAppsReducer,
  swap: swapReducer,
  partnersPromotion: partnersPromotionRucer,
  balances: balancesReducer,
  tokensMetadata: tokensMetadataReducer,
  abTesting: abTestingReducer,
  buyWithCreditCard: buyWithCreditCardReducer,
  collectibles: collectiblesPersistedReducer,
  newsletter: newsletterReducers
};

export const rootReducer = combineReducers(rootStateReducersMap);
