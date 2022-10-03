import React, { FC, useCallback, useMemo, useRef } from 'react';

import classNames from 'clsx';
import { useDispatch } from 'react-redux';
import { InfiniteLoader, List, WindowScroller } from 'react-virtualized';

import { loadMoreNewsAction } from 'app/store/news/news-actions';
import { welcomeNewsNotificationsMockData } from 'app/store/news/news-data';
import { NewsType, PlatformType, StatusType } from 'app/store/news/news-interfaces';
import { useNewsLoadingSelector, useNewsSelector, useReadedNewsIdsSelector } from 'app/store/news/news-selector';
import { T } from 'lib/i18n/react';
import { useLocalStorage } from 'lib/temple/front';
import { TempleNotificationsSharedStorageKey } from 'lib/temple/types';
import { getNewsItems } from 'lib/templewallet-api/news';

import { ReactComponent as BellGrayIcon } from '../../icons/bell-gray.svg';
import { ReactComponent as NotFoundIcon } from '../../icons/notFound.svg';
import PageLayout from '../../layouts/PageLayout';
import { NewsNotificationsItem } from './NewsNotifications/NewsNotificationsItem';

import 'react-virtualized/styles.css'; // only needs to be imported once

interface ListItemProps {
  style: React.HTMLAttributes<HTMLDivElement>;
  key: string;
  index: number;
}

export const Notifications: FC = () => {
  const dispatch = useDispatch();
  const news = useNewsSelector();
  const newsLoading = useNewsLoadingSelector();

  const lasLoadedRef = useRef<string>(welcomeNewsNotificationsMockData[0].id);

  const [newsNotificationsEnabled] = useLocalStorage<boolean>(
    TempleNotificationsSharedStorageKey.NewsNotificationsEnabled,
    true
  );

  const readNewsIds = useReadedNewsIdsSelector();

  const handleLoadMore = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      const lastNews = news[news.length - 1];
      if (newsNotificationsEnabled && news.length > 1 && lasLoadedRef.current !== lastNews.id) {
        return getNewsItems({
          platform: PlatformType.Extension,
          timeLt: new Date(lastNews.createdAt).getTime().toString()
        }).then(loadedNews => {
          lasLoadedRef.current = lastNews.id;
          dispatch(loadMoreNewsAction.success(loadedNews));
          resolve();
        });
      }
      reject();
      return;
    });
  }, [dispatch, news, newsNotificationsEnabled]);

  const allNews = useMemo(
    () => news.filter(newsItem => (newsNotificationsEnabled ? newsItem : newsItem.type !== NewsType.News)),
    [news, newsNotificationsEnabled]
  );

  const isRowLoaded = useCallback(
    ({ index }: { index: number }) => index < news.length && allNews[index] && !newsLoading,
    [news.length, allNews, newsLoading]
  );

  const itemRenderer = useCallback(
    ({ index, key, style }: ListItemProps) =>
      index >= allNews.length ? (
        <div key={key} style={style} />
      ) : (
        <NewsNotificationsItem
          key={key}
          {...allNews[index]}
          status={readNewsIds.indexOf(allNews[index].id) >= 0 ? StatusType.Read : StatusType.New}
          style={style}
        />
      ),
    [allNews, readNewsIds]
  );

  const remoteRowCount = useMemo(() => allNews.length + 1, [allNews.length]);

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
          {/* @ts-ignore */}
          <WindowScroller>
            {({ height, isScrolling, onChildScroll, scrollTop }) => (
              // @ts-ignore
              <InfiniteLoader isRowLoaded={isRowLoaded} loadMoreRows={handleLoadMore} rowCount={remoteRowCount}>
                {({ onRowsRendered, registerChild }) => (
                  // @ts-ignore
                  <List
                    autoHeight
                    height={height}
                    isScrolling={isScrolling}
                    onScroll={onChildScroll}
                    scrollTop={scrollTop}
                    ref={registerChild}
                    width={360}
                    rowHeight={150}
                    rowCount={remoteRowCount}
                    onRowsRendered={onRowsRendered}
                    noRowsRenderer={() => <NotificationsNotFound />}
                    // @ts-ignore
                    rowRenderer={itemRenderer}
                  />
                )}
              </InfiniteLoader>
            )}
          </WindowScroller>
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
