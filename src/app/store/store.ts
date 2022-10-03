import { createStore } from './create-store';
import { newsEpics } from './news/news-epics';

// ts-prune-ignore-next
export const { store, persistor } = createStore(newsEpics);
