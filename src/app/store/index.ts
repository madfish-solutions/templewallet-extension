import { TypedUseSelectorHook, useSelector as useRawSelector } from 'react-redux';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import storage from 'redux-persist/lib/storage';
import { PersistConfig } from 'redux-persist/lib/types';

import { notificationsEpics, notificationsReducer } from 'lib/notifications';
import { createStore, GetStateType, rootStateReducer } from 'lib/store';

import { abTestingEpics } from './ab-testing/epics';
import { abTestingReducer } from './ab-testing/reducers';
import { advertisingEpics } from './advertising/epics';
import { advertisingReducer } from './advertising/reducers';
import { balancesEpics } from './balances/epics';
import { balancesReducer } from './balances/reducers';
import { buyWithCreditCardEpics } from './buy-with-credit-card/epics';
import { buyWithCreditCardReducer } from './buy-with-credit-card/reducers';
import { currencyEpics } from './currency/epics';
import { currencyReducer } from './currency/reducers';
import { dAppsEpics } from './d-apps/epics';
import { dAppsReducer } from './d-apps/reducers';
import { partnersPromotionEpics } from './partners-promotion/epics';
import { partnersPromotionRucer } from './partners-promotion/reducers';
import { settingsReducer } from './settings/reducers';
import { swapEpics } from './swap/epics';
import { swapReducer } from './swap/reducers';
import { tokensMetadataEpics } from './tokens-metadata/epics';
import { tokensMetadataReducer } from './tokens-metadata/reducers';

const baseReducer = rootStateReducer({
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
  buyWithCreditCard: buyWithCreditCardReducer
});

export type RootState = GetStateType<typeof baseReducer>;

const persistConfigBlacklist: (keyof RootState)[] = ['buyWithCreditCard'];

const persistConfig: PersistConfig<RootState> = {
  key: 'temple-root',
  version: 1,
  storage: storage,
  stateReconciler: autoMergeLevel2,
  blacklist: persistConfigBlacklist
};

const epics = [
  currencyEpics,
  advertisingEpics,
  notificationsEpics,
  dAppsEpics,
  swapEpics,
  partnersPromotionEpics,
  balancesEpics,
  tokensMetadataEpics,
  abTestingEpics,
  buyWithCreditCardEpics
];

export const { store, persistor } = createStore(persistConfig, baseReducer, epics);

export const useSelector: TypedUseSelectorHook<RootState> = useRawSelector;
