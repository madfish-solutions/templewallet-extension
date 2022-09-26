import { useEffect, useRef, useState } from 'react';

import constate from 'constate';

import { useLocalStorage } from 'lib/temple/front/local-storage';
import { TempleNotificationsSharedStorageKey } from 'lib/temple/types';
import { getNewsItems } from 'lib/templewallet-api/news';

export enum NewsType {
  News = 'News',
  ApplicationUpdate = 'ApplicationUpdate',
  Alert = 'Alert'
}

export enum PlatformType {
  Mobile = 'Mobile',
  Extension = 'Extension'
}

export enum StatusType {
  New = 'New',
  Read = 'Read',
  Viewed = 'Viewed'
}

export interface NewsNotificationInterface {
  id: string;
  createdAt: string;
  status: StatusType;
  type: NewsType;
  platform: PlatformType;
  language: string;
  title: string;
  description: string;
  content: string;
  extensionImageUrl: string;
  mobileImageUrl: string;
  readInOriginalUrl: string;
}

export interface NewsNotificationsApiProps {
  welcome?: boolean;
  platform?: PlatformType;
  limit?: string;
  page?: string;
  timeLt?: string;
  timeGt?: string;
  sorted?: SortedBy;
}

export enum SortedBy {
  DateAsc = '0',
  DateDesc = '1'
}

export const welcomeNewsNotificationsMockData: Array<NewsNotificationInterface> = [
  {
    id: '0e',
    createdAt: '2022-09-01T00:00:00.000Z',
    status: StatusType.New,
    type: NewsType.News,
    platform: PlatformType.Extension,
    language: 'en-US',
    title: 'Just a heads up!',
    description: `• Jakarta protocol testnet is up. 
    \n• Ghostnet is now supported.
    \n• QuipuSwap Stable pools, Plenty Sta...`,
    content: `On June 27 we expect a Tezos protocol update, which entails some common network hurdles.

    \nNamely, on June 27-29 Exolix will be updating their software. Our integrated top-up service will not be 
available on those days.
    
    \nAdditionally, CEXes will likely enter the maintenance mode and temporarily suspend Tezos transactions.
    
    
    \n\nPlan accordingly and have a great`,
    extensionImageUrl: 'https://pbs.twimg.com/profile_images/1364551906283110400/4Ts3YPJz_400x400.jpg',
    mobileImageUrl: 'https://pbs.twimg.com/profile_images/1364551906283110400/4Ts3YPJz_400x400.jpg',
    readInOriginalUrl: 'https://templewallet.com/'
  }
];

// once per hour
const NEWS_REFRESH_INTERVAL = 60 * 60 * 1000;

export const [NewsProvider, useNews] = constate((params: { suspense?: boolean }) => {
  const [newsNotificationsEnabled] = useLocalStorage<boolean>(
    TempleNotificationsSharedStorageKey.NewsNotificationsEnabled,
    true
  );

  const [loadingDate, setLoadingDate] = useLocalStorage(
    TempleNotificationsSharedStorageKey.LastDateLoadNews,
    Date.now()
  );

  const [loading, setLoading] = useState(false);
  const [isAllLoaded, setIsAllLoaded] = useState<boolean>(false);
  const [readNewsIds] = useLocalStorage<string[]>(TempleNotificationsSharedStorageKey.ReadNewsIds, []);
  const [loadedNews, setLoadedNews] = useLocalStorage<NewsNotificationInterface[]>(
    TempleNotificationsSharedStorageKey.LoadedNewsKey,
    []
  );
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
    if (loadedNews.length > 0 && !isAllLoaded && newsNotificationsEnabled) {
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

  const getNewsItem = (id: string) =>
    [...welcomeNewsNotificationsMockData, ...news].find(newsItem => newsItem.id === id)!;

  return {
    isUnreadNews: readNewsIds.length < news.length,
    news,
    loading,
    isAllLoaded,
    getNewsItem,
    handleUpdate
  };
});

function unique(array: NewsNotificationInterface[], propertyName: keyof NewsNotificationInterface) {
  return array.filter((e, i) => array.findIndex(a => a[propertyName] === e[propertyName]) === i);
}
