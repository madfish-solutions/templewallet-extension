import { createStore } from './create-store';
import { walletEpics } from './wallet/wallet-epics';

// ts-prune-ignore-next
export const { store, persistor } = createStore(walletEpics);
