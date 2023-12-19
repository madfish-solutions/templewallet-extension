import { devToolsEnhancer } from '@redux-devtools/remote';
import { configureStore } from '@reduxjs/toolkit';
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from 'redux-persist';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import storage from 'redux-persist/lib/storage';

import { IS_DEV_ENV } from 'lib/env';

import { epicMiddleware, rootEpic } from './root-state.epics';
import { rootReducer } from './root-state.reducer';
import type { RootState } from './root-state.type';

const persistConfigBlacklist: (keyof RootState)[] = ['buyWithCreditCard', 'collectibles'];

const persistedReducer = persistReducer<RootState>(
  {
    key: 'temple-root',
    version: 1,
    storage,
    stateReconciler: autoMergeLevel2,
    blacklist: persistConfigBlacklist,
    debug: IS_DEV_ENV
  },
  rootReducer
);

const REDUX_DEVTOOLS_PORT = IS_DEV_ENV ? process.env.REDUX_DEVTOOLS_PORT : null;

const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware => {
    const defMiddleware = getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
      }
    });

    return defMiddleware.concat(epicMiddleware);
  },
  ...(REDUX_DEVTOOLS_PORT
    ? {
        devTools: false,
        enhancers: [devToolsEnhancer({ realtime: true, port: Number(REDUX_DEVTOOLS_PORT) })]
      }
    : {})
});

const persistor = persistStore(store);

epicMiddleware.run(rootEpic);

export { store, persistor };

export { useSelector } from './root-state.selector';
