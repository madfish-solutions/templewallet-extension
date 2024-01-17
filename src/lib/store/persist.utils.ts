import type { Transform } from 'redux-persist';

export const getPersistStorageKey = (key: string) => `persist:${key}`;

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
