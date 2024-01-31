import { devToolsEnhancer } from '@redux-devtools/remote';
import { Action, configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore, createMigrate } from 'redux-persist';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';

import { IS_DEV_ENV } from 'lib/env';
import { storageConfig } from 'lib/store';

import { sanitizeCollectiblesMetadataForDevTools } from './collectibles-metadata/state';
import { MIGRATIONS } from './migrations';
import { epicMiddleware, rootEpic } from './root-state.epics';
import { rootReducer } from './root-state.reducer';
import type { RootState } from './root-state.type';

export const SLICES_BLACKLIST = [
  'buyWithCreditCard' as const,
  'collectibles' as const,
  'assets' as const,
  'collectiblesMetadata' as const
];

const persistConfigBlacklist: (keyof RootState)[] = SLICES_BLACKLIST;

const persistedReducer = persistReducer<RootState>(
  {
    key: 'temple-root',
    version: 2,
    ...storageConfig,
    stateReconciler: autoMergeLevel2,
    blacklist: persistConfigBlacklist,
    debug: IS_DEV_ENV,
    migrate: createMigrate(MIGRATIONS, { debug: IS_DEV_ENV })
  },
  rootReducer
);

const REDUX_DEVTOOLS_PORT = IS_DEV_ENV ? process.env.REDUX_DEVTOOLS_PORT : null;

const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware => {
    const defMiddleware = getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false
    });

    return defMiddleware.concat(epicMiddleware);
  },
  devTools: false,
  enhancers: REDUX_DEVTOOLS_PORT
    ? [
        // See: https://github.com/zalmoxisus/remote-redux-devtools?tab=readme-ov-file#parameters
        devToolsEnhancer<RootState, Action>({
          realtime: true,
          port: Number(REDUX_DEVTOOLS_PORT),
          // See: https://github.com/reduxjs/redux-devtools/issues/496#issuecomment-670246737
          stateSanitizer: state => ({
            ...state,
            collectiblesMetadata: sanitizeCollectiblesMetadataForDevTools(state.collectiblesMetadata)
          })
        })
      ]
    : undefined
});

const persistor = persistStore(store);

epicMiddleware.run(rootEpic);

const dispatch = store.dispatch.bind(store);

export { store, persistor, dispatch };

export { useSelector } from './root-state.selector';
