import { configureStore } from '@reduxjs/toolkit';
import { Middleware } from 'redux';
import { combineEpics, createEpicMiddleware, Epic, StateObservable } from 'redux-observable';
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from 'redux-persist';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import storage from 'redux-persist/lib/storage';
import { PersistConfig } from 'redux-persist/lib/types';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { rootStateReducer } from './root-state.reducers';
import { walletReducers } from './wallet/wallet-reducers';
import { WalletRootState } from './wallet/wallet-state';

export type RootState = WalletRootState;

const epicMiddleware = createEpicMiddleware();
const middlewares: Array<Middleware<{}, RootState>> = [epicMiddleware];

const persistConfig: PersistConfig<RootState> = {
  key: 'temple-root',
  version: 1,
  storage: storage,
  stateReconciler: autoMergeLevel2
};

const rootReducer = rootStateReducer<RootState>({
  wallet: walletReducers
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
