import { createStore } from './create-store';
import { walletEpics } from './wallet/wallet-epics';

export const { store, persistor } = createStore(walletEpics);
