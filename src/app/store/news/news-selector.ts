import { useSelector } from 'react-redux';

import { welcomeNewsNotificationsMockData } from './news-data';
import { NewsRootState, NewsState } from './news-state';

const useBaseSelector = () => {
  const loadedNews = useSelector<NewsRootState, NewsState['news']>(({ newsState }) => newsState.news);
  const news = Array.isArray(loadedNews)
    ? loadedNews
        .concat(welcomeNewsNotificationsMockData)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  return news;
};

export const useNewsIdSelector = (key: string) => useBaseSelector().find(x => x.id === key);

export const useNewsSelector = () => useBaseSelector();

export const useReadedNewsIdsSelector = () =>
  useSelector<NewsRootState, NewsState['readNewsIds']>(({ newsState }) => newsState.readNewsIds);

export const useIsEveryNewsReadedSelector = () =>
  useSelector<NewsRootState, boolean>(({ newsState }) =>
    // check if news array fully contained in readNews array
    // e.g. every news item is readed
    newsState.news.map(x => x.id).every(x => newsState.readNewsIds.includes(x))
  );

export const useNewsLoadingSelector = () =>
  useSelector<NewsRootState, NewsState['loading']>(({ newsState }) => newsState.loading);
