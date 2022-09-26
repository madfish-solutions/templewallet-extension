import React, { FC, useCallback, useRef } from 'react';

import classNames from 'clsx';

import { ActivitySpinner } from 'app/atoms/ActivitySpinner';
import { NewsType, StatusType, useNews } from 'lib/temple/front/news.provider';
import { useIntersectionDetection } from 'lib/ui/use-intersection-detection';

import { T } from '../../../lib/i18n/react';
import { TempleNotificationsSharedStorageKey, useLocalStorage } from '../../../lib/temple/front';
import { ReactComponent as BellGrayIcon } from '../../icons/bell-gray.svg';
import { ReactComponent as NotFoundIcon } from '../../icons/notFound.svg';
import PageLayout from '../../layouts/PageLayout';
import { NewsNotificationsItem } from './NewsNotifications/NewsNotificationsItem';

export const Notifications: FC = () => {
  const { news, handleUpdate: handleLoadMoreNews, loading: newsLoading, isAllLoaded: isAllNewsLoaded } = useNews();

  const [newsNotificationsEnabled] = useLocalStorage<boolean>(
    TempleNotificationsSharedStorageKey.NewsNotificationsEnabled,
    true
  );

  const [readNewsIds] = useLocalStorage<string[]>(TempleNotificationsSharedStorageKey.ReadNewsIds, []);

  const allNews = news.filter(newsItem => (newsNotificationsEnabled ? newsItem : newsItem.type !== NewsType.News));

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleIntersection = useCallback(() => {
    if (!isAllNewsLoaded) {
      handleLoadMoreNews();
    }
  }, [isAllNewsLoaded, handleLoadMoreNews]);

  useIntersectionDetection(loadMoreRef, handleIntersection);

  return (
    <PageLayout
      pageTitle={
        <>
          <BellGrayIcon className="w-auto h-4 mr-1 stroke-current" />
          <T id="notifications" />
        </>
      }
      contentContainerStyle={{ padding: 0 }}
    >
      <div className="max-w-sm mx-auto">
        <div className={classNames('pt-6')}>
          {allNews.length === 0 ? (
            <NotificationsNotFound />
          ) : (
            <>
              {allNews.map((newsItem, index) => (
                <NewsNotificationsItem
                  key={newsItem.id}
                  index={index}
                  {...newsItem}
                  status={readNewsIds.indexOf(newsItem.id) >= 0 ? StatusType.Read : StatusType.New}
                />
              ))}
              {!isAllNewsLoaded && <div ref={loadMoreRef} className="w-full flex justify-center mt-5 mb-3"></div>}
              {newsLoading && <ActivitySpinner />}
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

const NotificationsNotFound = () => (
  <div className={classNames('mx-12', 'flex flex-col items-center justify-center', 'text-gray-600')}>
    <NotFoundIcon />
    <h3 className="font-inter text-sm font-normal text-center mt-2">
      <T id="notificationsNotFound" />
    </h3>
  </div>
);
