import { getStoredState, PersistConfig, type Transform, type PersistedState } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { ReduxPersistStorage } from './storage';

export const PERSIST_STATE_KEY = '_persist';

export const createTransformsBeforePersist = <S extends object>(
  transformers: Partial<{
    [K in keyof S]: (subState: S[K], originalState: S) => S[K];
  }>
) => {
  type K = keyof S;

  const transform: Transform<S[K], S[K], S> = {
    in: (subState: S[K], key: K, state: S) => {
      if (key === PERSIST_STATE_KEY) return subState;

      try {
        const transformerFn = transformers[key];
        if (transformerFn) return transformerFn(subState, state);
      } catch (err) {
        console.error(err);
      }

      return subState;
    },
    out: state => state
  };

  return transform;
};

export const createTransformsBeforeHydrate = <S extends object>(
  transformers: Partial<{
    [K in keyof S]: (subState: S[K]) => S[K];
  }>
) => {
  type K = keyof S;

  const transform: Transform<S[K], S[K], S> = {
    in: state => state,
    out: (subState: S[K], key) => {
      if (key === PERSIST_STATE_KEY) return subState;

      try {
        const transformerFn = transformers[key as K];
        if (transformerFn) return transformerFn(subState);
      } catch (err) {
        console.error(err);
      }

      return subState;
    }
  };

  return transform;
};

/**
 * See: https://github.com/rt2zz/redux-persist/issues/806#issuecomment-695053978
 */
const getStoredStateToMigrateStorage = async (config: PersistConfig<any>) => {
  // Reading from current storage
  let state = await getStoredState(config);
  if (state) {
    return state as PersistedState;
  }

  // Falling back to old. Not cleaning it just for extra caution.
  state = await getStoredState({
    ...config,
    serialize: true,
    // @ts-expect-error // For absent definition
    deserialize: true,
    storage
  });

  return state as PersistedState;
};

export const storageConfig = {
  storage: ReduxPersistStorage,
  serialize: false,
  deserialize: false,
  getStoredState: getStoredStateToMigrateStorage
};
