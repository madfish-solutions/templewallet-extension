import type { PersistPartial } from 'redux-persist/es/persistReducer';

import { PERSIST_STATE_KEY } from './persist.utils';

const persistPropertyMock: PersistPartial = {
  [PERSIST_STATE_KEY]: {
    version: 0,
    rehydrated: false
  }
};

export const mockPersistedState = <S>(state: S) => ({ ...state, ...persistPropertyMock });
