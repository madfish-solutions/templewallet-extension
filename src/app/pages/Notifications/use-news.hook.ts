import { useEffect, useState } from 'react';

import { useLocalStorage } from 'lib/temple/front';
import { getNewsCount, getNewsItems } from 'lib/templewallet-api/news';

import { NewsNotificationInterface } from './NewsNotifications/NewsNotifications.interface';

export const useNews = () => {
  const [loading, setLoading] = useState(false);
  const [unreadNews, setUnreadNews] = useState(false);
  const [loadedNews, setLoadedNews] = useState<NewsNotificationInterface[]>([]);
  const lastReadDate = useLocalStorage('lastReadDate', new Date(0));

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [{ count }, news] = await Promise.all([getNewsCount({ welcome: true }), getNewsItems({ welcome: true })]);
        setUnreadNews(count > 0);
        setLoadedNews(news);
        setLoading(false);
      } catch {
        setLoading(false);
      }
      setLoading(false);
    })();
  }, []);

  return {
    isUnreadNews: unreadNews,
    news: loadedNews,
    loading
  };
};
