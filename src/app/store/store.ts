import { createStore } from './create-store';
import { newsEpics } from './news/news-epics';

export const { store, persistor } = createStore(newsEpics);
