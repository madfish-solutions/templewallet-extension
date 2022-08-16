import { useEffect, useState } from 'react';

import { TempleNotificationsSharedStorageKey, useLocalStorage } from 'lib/temple/front';
import { getNewsItems } from 'lib/templewallet-api/news';

import { welcomeNewsNotificationsMockData } from './NewsNotifications/NewsNotifications.data';
import { NewsNotificationInterface, PlatformType, StatusType } from './NewsNotifications/NewsNotifications.interface';

const NEWS_REFRESH_INTERVAL = 3600000;

export const useNews = () => {
  const [newsNotificationsEnabled] = useLocalStorage<boolean>(
    TempleNotificationsSharedStorageKey.NewsNotificationsEnabled,
    true
  );

  const [loadingDate, setLoadingDate] = useLocalStorage('loadingDate', 0);

  const [loading, setLoading] = useState(false);
  const [isAllLoaded, setIsAllLoaded] = useState<boolean>(false);
  const [readNewsIds] = useLocalStorage<string[]>(TempleNotificationsSharedStorageKey.UnreadNewsIds, []);
  const [loadedNews, setLoadedNews] = useLocalStorage<NewsNotificationInterface[]>('loadedNews', []);
  // const lastReadDate = useLocalStorage('lastReadDate', new Date(0));

  useEffect(() => {
    (async () => {
      try {
        if (Date.now() - loadingDate < NEWS_REFRESH_INTERVAL || !newsNotificationsEnabled) {
          return;
        }
        setLoadingDate(Date.now());
        setLoading(true);
        const news = await getNewsItems({ platform: PlatformType.Extension });
        if (news.length === 0) {
          setIsAllLoaded(true);
        }
        setLoadedNews(news.map(x => ({ ...x, status: StatusType.New })));
        setLoading(false);
      } catch {
        setLoading(false);
      }
      setLoading(false);
    })();
  }, [loadingDate, setLoadedNews, setLoadingDate, newsNotificationsEnabled]);

  const handleUpdate = async () => {
    if (loadedNews.length > 0 && !isAllLoaded) {
      const lastNews = loadedNews[loadedNews.length - 1];

      if (lastNews) {
        setLoading(true);
        const news = await getNewsItems({ platform: PlatformType.Extension });
        if (news.length === 0) {
          setIsAllLoaded(true);
        }
        setLoading(false);
        setLoadedNews(prev => [...prev, ...news.map(x => ({ ...x, status: StatusType.New }))]);
      }
    }
  };

  const news = loadedNews
    .concat(welcomeNewsNotificationsMockData)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    isUnreadNews: readNewsIds.length < news.length,
    news,
    loading,
    handleUpdate
  };
};
