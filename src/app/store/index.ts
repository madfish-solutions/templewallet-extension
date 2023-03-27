import { TypedUseSelectorHook, useSelector as useRawSelector } from 'react-redux';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import storage from 'redux-persist/lib/storage';
import { PersistConfig } from 'redux-persist/lib/types';

import { notificationsEpics, notificationsReducers } from 'lib/notifications';
import { createStore, GetStateType, rootStateReducer } from 'lib/store';

import { advertisingEpics } from './advertising/epics';
import { advertisingReducer } from './advertising/reducers';
import { balanceModeReducer } from './balance-mode/reducers';
import { balancesEpics } from './balances/epics';
import { balancesReducer } from './balances/reducers';
import { currencyEpics } from './currency/epics';
import { currencyReducer } from './currency/reducers';
import { dAppsEpics } from './d-apps/epics';
import { dAppsReducer } from './d-apps/reducers';
import { partnersPromotionEpics } from './partners-promotion/epics';
import { partnersPromotionRucer } from './partners-promotion/reducers';

const baseReducer = rootStateReducer({
  advertising: advertisingReducer,
  currency: currencyReducer,
  notifications: notificationsReducers,
  dApps: dAppsReducer,
  balanceMode: balanceModeReducer,
  partnersPromotion: partnersPromotionRucer,
  balances: balancesReducer
});

export type RootState = GetStateType<typeof baseReducer>;

const persistConfig: PersistConfig<RootState> = {
  key: 'temple-root',
  version: 1,
  storage: storage,
  stateReconciler: autoMergeLevel2
};

const epics = [currencyEpics, advertisingEpics, notificationsEpics, dAppsEpics, partnersPromotionEpics, balancesEpics];

export const { store, persistor } = createStore(persistConfig, baseReducer, epics);

export const useSelector: TypedUseSelectorHook<RootState> = useRawSelector;
