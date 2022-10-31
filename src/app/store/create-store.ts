import { configureStore } from '@reduxjs/toolkit';
import { Middleware } from 'redux';
import { createLogger } from 'redux-logger';
import { combineEpics, createEpicMiddleware, Epic, StateObservable } from 'redux-observable';
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from 'redux-persist';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import storage from 'redux-persist/lib/storage';
import { PersistConfig } from 'redux-persist/lib/types';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { IS_DEV_ENV } from 'lib/env';

import { advertisingReducer } from './advertising/reducers';
import { AdvertisingRootState } from './advertising/state';
import { newsReducer } from './news/news-reducers';
import { NewsRootState } from './news/news-state';
import { rootStateReducer } from './root-state.reducers';
import { walletReducer } from './wallet/reducers';
import { WalletRootState } from './wallet/state';

export type RootState = WalletRootState & NewsRootState & AdvertisingRootState;

const logger = createLogger();

const epicMiddleware = createEpicMiddleware();
const middlewares: Array<Middleware<{}, RootState>> = IS_DEV_ENV ? [epicMiddleware, logger] : [epicMiddleware];

const persistConfig: PersistConfig<RootState> = {
  key: 'temple-root',
  version: 1,
  storage: storage,
  stateReconciler: autoMergeLevel2
};

const rootReducer = rootStateReducer<RootState>({
  newsState: newsReducer,
  wallet: walletReducer,
  advertising: advertisingReducer
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const createStore = (...epics: Epic[]) => {
  const rootEpic = (action$: Observable<any>, store$: StateObservable<any>, dependencies: any) =>
    combineEpics(...epics)(action$, store$, dependencies).pipe(
      catchError((error, source) => {
        console.error(error);

        return source;
      })
    );

  const store = configureStore({
    reducer: persistedReducer,
    middleware: getDefaultMiddleware => {
      return getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
        }
      }).concat(middlewares);
    }
  });

  const persistor = persistStore(store);

  epicMiddleware.run(rootEpic);

  return { store, persistor };
};
