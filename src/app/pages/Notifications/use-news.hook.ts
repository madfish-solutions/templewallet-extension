import { useEffect, useRef, useState } from 'react';

import { TempleNotificationsSharedStorageKey, useLocalStorage } from 'lib/temple/front';
import { getNewsItems } from 'lib/templewallet-api/news';

import { welcomeNewsNotificationsMockData } from './NewsNotifications/NewsNotifications.data';
import { NewsNotificationInterface, PlatformType, StatusType } from './NewsNotifications/NewsNotifications.interface';

// once per hour
const NEWS_REFRESH_INTERVAL = 3600000;

export const useNews = () => {
  const [newsNotificationsEnabled] = useLocalStorage<boolean>(
    TempleNotificationsSharedStorageKey.NewsNotificationsEnabled,
    true
  );

  const [loadingDate, setLoadingDate] = useLocalStorage('loadingDate', 0);

  const [loading, setLoading] = useState(false);
  const [isAllLoaded, setIsAllLoaded] = useState<boolean>(false);
  const [readNewsIds] = useLocalStorage<string[]>(TempleNotificationsSharedStorageKey.ReadNewsIds, []);
  const [loadedNews, setLoadedNews] = useLocalStorage<NewsNotificationInterface[]>('loadedNews', []);
  const lastNewsIdRef = useRef<string>('');

  useEffect(() => {
    (async () => {
      try {
        if (Date.now() - loadingDate < NEWS_REFRESH_INTERVAL || !newsNotificationsEnabled) {
          return;
        }
        setLoadingDate(Date.now());
        setLoading(true);
        const news = await getNewsItems({
          platform: PlatformType.Extension,
          timeGt: new Date(loadingDate).toISOString()
        });
        setIsAllLoaded(false);
        setLoadedNews(prev => unique([...prev, ...news.map(x => ({ ...x, status: StatusType.New }))], 'id'));
      } catch {
        setIsAllLoaded(true);
      }
      setLoading(false);
    })();
  }, [loadingDate, setLoadedNews, setLoadingDate, newsNotificationsEnabled]);

  const handleUpdate = async () => {
    if (loadedNews.length > 0 && !isAllLoaded) {
      const lastNews = loadedNews[loadedNews.length - 1];

      if (lastNews) {
        if (lastNews.id !== lastNewsIdRef.current) {
          lastNewsIdRef.current = lastNews.id;
          setLoading(true);
          const news = await getNewsItems({
            platform: PlatformType.Extension,
            timeLt: new Date(lastNews.createdAt).getTime().toString()
          });
          if (news.length === 0) {
            setIsAllLoaded(true);
          }
          setLoading(false);
          setLoadedNews(prev => unique([...prev, ...news.map(x => ({ ...x, status: StatusType.New }))], 'id'));
        }
      }
    }
  };

  const news = Array.isArray(loadedNews)
    ? loadedNews
        .concat(welcomeNewsNotificationsMockData)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  return {
    isUnreadNews: readNewsIds.length < news.length,
    news,
    loading,
    isAllLoaded,
    handleUpdate
  };
};

function unique(array: NewsNotificationInterface[], propertyName: keyof NewsNotificationInterface) {
  return array.filter((e, i) => array.findIndex(a => a[propertyName] === e[propertyName]) === i);
}
