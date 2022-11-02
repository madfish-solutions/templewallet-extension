import { advertisingEpics } from './advertising/epics';
import { createStore } from './create-store';
import { walletEpics } from './wallet/epics';

export const { store, persistor } = createStore(walletEpics, advertisingEpics);
