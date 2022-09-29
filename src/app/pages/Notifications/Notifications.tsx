import React, { FC } from 'react';

import classNames from 'clsx';
import { List } from 'react-virtualized';

import { ActivitySpinner } from 'app/atoms/ActivitySpinner';
import { NewsType, StatusType } from 'app/store/news/news-interfaces';
import { useNewsLoadingSelector, useNewsSelector, useReadedNewsIdsSelector } from 'app/store/news/news-selector';
import { T } from 'lib/i18n/react';
import { useLocalStorage } from 'lib/temple/front';
import { TempleNotificationsSharedStorageKey } from 'lib/temple/types';

import { ReactComponent as BellGrayIcon } from '../../icons/bell-gray.svg';
import { ReactComponent as NotFoundIcon } from '../../icons/notFound.svg';
import PageLayout from '../../layouts/PageLayout';
import { NewsNotificationsItem } from './NewsNotifications/NewsNotificationsItem';

export const Notifications: FC = () => {
  const news = useNewsSelector();
  const newsLoading = useNewsLoadingSelector();

  const [newsNotificationsEnabled] = useLocalStorage<boolean>(
    TempleNotificationsSharedStorageKey.NewsNotificationsEnabled,
    true
  );

  const readNewsIds = useReadedNewsIdsSelector();

  const allNews = news.filter(newsItem => (newsNotificationsEnabled ? newsItem : newsItem.type !== NewsType.News));

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
          {allNews.length === 0 && <NotificationsNotFound />}
          {/* @ts-ignore */}
          <List
            height={3000}
            autoHeight
            rowHeight={200}
            width={1200}
            autoWidth
            rowCount={allNews.length}
            rowRenderer={({ index }) => (
              <NewsNotificationsItem
                key={allNews[index].id}
                index={index}
                {...allNews[index]}
                status={readNewsIds.indexOf(allNews[index].id) >= 0 ? StatusType.Read : StatusType.New}
              />
            )}
          />
          {newsLoading && <ActivitySpinner />}
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
