import React, { FC, useCallback, useEffect, useRef } from 'react';

import classNames from 'clsx';

import { ActivitySpinner } from 'app/atoms/ActivitySpinner';
import { TabDescriptor, TabSwitcher } from 'app/atoms/TabSwitcher';
import { useIntersectionDetection } from 'lib/ui/use-intersection-detection';

import { T } from '../../../lib/i18n/react';
import { TempleNotificationsSharedStorageKey, useLocalStorage } from '../../../lib/temple/front';
import { useAppEnv } from '../../env';
import { ReactComponent as BellGrayIcon } from '../../icons/bell-gray.svg';
import { ReactComponent as NotFoundIcon } from '../../icons/notFound.svg';
import PageLayout from '../../layouts/PageLayout';
import { BidActivity } from './ActivityNotifications/activities/BidActivity';
import { CollectibleActivity } from './ActivityNotifications/activities/CollectibleActivity';
import { TransactionActivity } from './ActivityNotifications/activities/TransactionActivity';
import { ActivityType, StatusType } from './ActivityNotifications/ActivityNotifications.interface';
import { NewsType } from './NewsNotifications/NewsNotifications.interface';
import { NewsNotificationsItem } from './NewsNotifications/NewsNotificationsItem';
import { useEvents } from './use-events.hook';
import { useNews } from './use-news.hook';
import { useReadEvents } from './use-read-events.hook';

interface NotificationsProps {
  tabSlug?: string;
}

const FIVE_SECONDS = 5000;

export const Notifications: FC<NotificationsProps> = ({ tabSlug = 'events' }) => {
  const isEvent = tabSlug === 'events';
  // const { data: myBakerPkh } = useDelegate(publicKeyHash);
  // const chainId = useChainId(true);

  const {
    isUnreadNews,
    news,
    loading: newsLoading,
    isAllLoaded: isAllNewsLoaded,
    handleUpdate: handleLoadMoreNews
  } = useNews();
  const { events, handleUpdate: handleLoadMoreEvents, loading, isAllLoaded: isAllEventsLoaded } = useEvents();

  const { readManyEvents, isEventUnread, readEventsIds } = useReadEvents();

  useEffect(() => {
    const timeout = setTimeout(() => {
      const ids = [];
      for (const event of events) {
        if (event.status === StatusType.New && isEventUnread(event)) {
          ids.push(event.id);
        }
      }
      readManyEvents(ids);
    }, FIVE_SECONDS);
    return () => {
      clearTimeout(timeout);
    };
  }, [events, isEventUnread, readManyEvents]);

  // const getBakingHistory = useCallback(
  //   async (_k: string, accountPkh: string) => {
  //     if (!isKnownChainId(chainId!) || !TZKT_API_BASE_URLS.has(chainId)) {
  //       return [];
  //     }
  //     return (
  //       (await getDelegatorRewards(chainId, {
  //         address: accountPkh,
  //         limit: 30
  //       })) || []
  //     );
  //   },
  //   [chainId]
  // );
  // const { data: bakingHistory, isValidating: loadingBakingHistory } = useRetryableSWR(
  //   ['baking-history', publicKeyHash, myBakerPkh, chainId],
  //   getBakingHistory,
  //   { suspense: true, revalidateOnFocus: false, revalidateOnReconnect: false }
  // );
  // const rewardsPerEventHistory = useMemo(() => {
  //   if (!bakingHistory) {
  //     return [];
  //   }
  //   return bakingHistory.map(historyItem => {
  //     const {
  //       endorsements,
  //       endorsementRewards,
  //       futureBlocks,
  //       futureBlockRewards,
  //       futureEndorsements,
  //       futureEndorsementRewards,
  //       ownBlocks,
  //       ownBlockRewards
  //     } = historyItem;
  //     const rewardPerOwnBlock = ownBlocks === 0 ? undefined : new BigNumber(ownBlockRewards).div(ownBlocks);
  //     const rewardPerEndorsement = endorsements === 0 ? undefined : new BigNumber(endorsementRewards).div(endorsements);
  //     const rewardPerFutureBlock = futureBlocks === 0 ? undefined : new BigNumber(futureBlockRewards).div(futureBlocks);
  //     const rewardPerFutureEndorsement =
  //       futureEndorsements === 0 ? undefined : new BigNumber(futureEndorsementRewards).div(futureEndorsements);
  //     return {
  //       rewardPerOwnBlock,
  //       rewardPerEndorsement,
  //       rewardPerFutureBlock,
  //       rewardPerFutureEndorsement
  //     };
  //   });
  // }, [bakingHistory]);
  // const fallbackRewardsPerEvents = useMemo(() => {
  //   return rewardsPerEventHistory.map(historyItem =>
  //     allRewardsPerEventKeys.reduce(
  //       (fallbackRewardsItem, key, index) => {
  //         return reduceFunction(fallbackRewardsItem, key, index, historyItem, rewardsPerEventHistory);
  //       },
  //       {
  //         rewardPerOwnBlock: new BigNumber(0),
  //         rewardPerEndorsement: new BigNumber(0),
  //         rewardPerFutureBlock: new BigNumber(0),
  //         rewardPerFutureEndorsement: new BigNumber(0)
  //       }
  //     )
  //   );
  // }, [rewardsPerEventHistory]);
  // const currentCycle = useMemo(
  //   () =>
  //     bakingHistory?.find(
  //       ({ extraBlockRewards, endorsementRewards, ownBlockRewards, ownBlockFees, extraBlockFees }) => {
  //         const totalCurrentRewards = new BigNumber(extraBlockRewards)
  //           .plus(endorsementRewards)
  //           .plus(ownBlockRewards)
  //           .plus(ownBlockFees)
  //           .plus(extraBlockFees);
  //         return totalCurrentRewards.gt(0);
  //       }
  //     )?.cycle,
  //   [bakingHistory]
  // );
  // console.log(
  //   bakingHistory?.map(() =>
  //     getLuckAndRewardAndCycleStatus({
  //       x.content,
  //       x.currentCycle,
  //       fallbackRewardPerEndorsement,
  //       fallbackRewardPerFutureBlock,
  //       fallbackRewardPerFutureEndorsement,
  //       fallbackRewardPerOwnBlock
  //     })
  //   )
  // );

  const [newsNotificationsEnabled] = useLocalStorage<boolean>(
    TempleNotificationsSharedStorageKey.NewsNotificationsEnabled,
    true
  );

  const [readNewsIds] = useLocalStorage<string[]>(TempleNotificationsSharedStorageKey.ReadNewsIds, []);

  const allNews = news.filter(newsItem => (newsNotificationsEnabled ? newsItem : newsItem.type !== NewsType.News));

  const NotificationOptions: TabDescriptor[] = [
    {
      slug: 'events',
      i18nKey: 'events',
      isDotVisible: readEventsIds.length < events.length
    },
    {
      slug: 'news',
      i18nKey: 'news',
      isDotVisible: isUnreadNews
    }
  ];

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { popup } = useAppEnv();

  const handleIntersection = useCallback(() => {
    if (!isEvent) {
      if (!isAllNewsLoaded) {
        handleLoadMoreNews();
      }
    } else {
      if (!isAllEventsLoaded) {
        handleLoadMoreEvents();
      }
    }
  }, [isEvent, isAllEventsLoaded, isAllNewsLoaded, handleLoadMoreNews, handleLoadMoreEvents]);

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
      <TabSwitcher
        tabs={NotificationOptions}
        activeTabSlug={tabSlug}
        urlPrefix="/notifications"
        className={classNames('mt-4 mb-6', popup ? 'px-7' : 'px-32')}
      />
      <div style={{ maxWidth: '360px', margin: 'auto' }} className="pb-8">
        <div className={popup ? 'mx-5' : ''}>
          {isEvent ? (
            events.length === 0 ? (
              <NotificationsNotFound />
            ) : (
              <>
                {events.map((activity, index) => {
                  switch (activity.type) {
                    case ActivityType.Transaction:
                      return (
                        <TransactionActivity
                          key={activity.id}
                          index={index}
                          {...activity}
                          status={isEventUnread(activity) ? StatusType.New : StatusType.Read}
                        />
                      );
                    // case ActivityType.BakerRewards:
                    //   return <BakerRewardsActivity key={activity.id} index={index} {...activity} />;
                    case ActivityType.BidMade:
                    case ActivityType.BidReceived:
                    case ActivityType.BidOutbited:
                      return (
                        <BidActivity
                          key={activity.id}
                          index={index}
                          {...activity}
                          status={isEventUnread(activity) ? StatusType.New : StatusType.Read}
                        />
                      );
                    default:
                      return (
                        <CollectibleActivity
                          key={activity.id}
                          index={index}
                          {...activity}
                          status={isEventUnread(activity) ? StatusType.New : StatusType.Read}
                        />
                      );
                  }
                })}
                {!isAllEventsLoaded && <div ref={loadMoreRef} className="w-full flex justify-center mt-5 mb-3"></div>}
                {loading && <ActivitySpinner />}
              </>
            )
          ) : allNews.length === 0 ? (
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
