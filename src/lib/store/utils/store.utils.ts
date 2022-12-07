import { configureStore } from '@reduxjs/toolkit';
import { Action, Reducer } from 'redux';
import { combineEpics, createEpicMiddleware, Epic, StateObservable } from 'redux-observable';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
  PersistConfig
} from 'redux-persist';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

const epicMiddleware = createEpicMiddleware();
const middlewares = [epicMiddleware];

export const createStore = <S, A extends Action = Action>(
  persistConfig: PersistConfig<S>,
  baseReducer: Reducer<S, A>,
  epics: Epic[]
) => {
  const persistedReducer = persistReducer(persistConfig, baseReducer);

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
