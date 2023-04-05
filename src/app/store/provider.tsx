import React from 'react';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { store, persistor } from './index';

export const StoreProvider: React.FC<PropsWithChildren> = ({ children }) => (
  <Provider store={store}>
    <PersistGate persistor={persistor} loading={null}>
      {children}
    </PersistGate>
  </Provider>
);
