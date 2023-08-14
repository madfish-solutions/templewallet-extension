import type { PersistPartial } from 'redux-persist/es/persistReducer';

const persistPropertyMock: PersistPartial = {
  _persist: {
    version: 0,
    rehydrated: false
  }
};

export const mockPersistedState = <S>(state: S) => ({ ...state, ...persistPropertyMock });
