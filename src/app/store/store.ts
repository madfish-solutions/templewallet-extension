import { advertisingEpics } from './advertising/epics';
import { createStore } from './create-store';
import { newsEpics } from './news/news-epics';
import { walletEpics } from './wallet/epics';

export const { store, persistor } = createStore(walletEpics, newsEpics, advertisingEpics);
