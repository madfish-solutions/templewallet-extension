import React, { FC } from 'react';

import classNames from 'clsx';

import { TabDescriptor, TabSwitcher } from 'app/atoms/TabSwitcher';

import { T } from '../../../lib/i18n/react';
import { TempleNotificationsSharedStorageKey, useLocalStorage } from '../../../lib/temple/front';
import { useAppEnv } from '../../env';
import { ReactComponent as BellGrayIcon } from '../../icons/bell-gray.svg';
import { ReactComponent as NotFoundIcon } from '../../icons/notFound.svg';
import PageLayout from '../../layouts/PageLayout';
import { BakerRewardsActivity } from './ActivityNotifications/activities/BakerRewardsActivity';
import { BidActivity } from './ActivityNotifications/activities/BidActivity';
import { CollectibleActivity } from './ActivityNotifications/activities/CollectibleActivity';
import { TransactionActivity } from './ActivityNotifications/activities/TransactionActivity';
import { activityNotificationsMockData } from './ActivityNotifications/ActivityNotifications.data';
import { ActivityType, StatusType } from './ActivityNotifications/ActivityNotifications.interface';
import {
  newsNotificationsMockData,
  welcomeNewsNotificationsMockData
} from './NewsNotifications/NewsNotifications.data';
import { NewsType } from './NewsNotifications/NewsNotifications.interface';
import { NewsNotificationsItem } from './NewsNotifications/NewsNotificationsItem';

interface NotificationsProps {
  tabSlug?: string;
}

export const Notifications: FC<NotificationsProps> = ({ tabSlug = 'activity' }) => {
  const isActivity = tabSlug === 'activity';

  const [newsNotificationsEnabled] = useLocalStorage<boolean>(
    TempleNotificationsSharedStorageKey.NewsNotificationsEnabled,
    true
  );
  const [chainNotificationsEnabled] = useLocalStorage<boolean>(
    TempleNotificationsSharedStorageKey.ChainNotificationsEnabled,
    true
  );

  const allNews = [...welcomeNewsNotificationsMockData, ...newsNotificationsMockData].filter(newsItem =>
    newsNotificationsEnabled ? newsItem : newsItem.type !== NewsType.News
  );

  const NotificationOptions: TabDescriptor[] = [
    {
      slug: 'activity',
      i18nKey: 'activity',
      isDotVisible:
        activityNotificationsMockData.find(activity => activity.status === StatusType.New) !== undefined &&
        chainNotificationsEnabled
    },
    {
      slug: 'news',
      i18nKey: 'news',
      isDotVisible: allNews.find(newsItem => newsItem.status === StatusType.New) !== undefined
    }
  ];

  const { popup } = useAppEnv();

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
          {isActivity ? (
            activityNotificationsMockData.length === 0 || !chainNotificationsEnabled ? (
              <NotificationsNotFound />
            ) : (
              activityNotificationsMockData.map((activity, index) => {
                switch (activity.type) {
                  case ActivityType.Transaction:
                    return <TransactionActivity key={activity.id} index={index} {...activity} />;
                  case ActivityType.BakerRewards:
                    return <BakerRewardsActivity key={activity.id} index={index} {...activity} />;
                  case ActivityType.BidMade:
                  case ActivityType.BidReceived:
                  case ActivityType.BidOutbited:
                    return <BidActivity key={activity.id} index={index} {...activity} />;
                  default:
                    return <CollectibleActivity key={activity.id} index={index} {...activity} />;
                }
              })
            )
          ) : allNews.length === 0 ? (
            <NotificationsNotFound />
          ) : (
            allNews.map((newsItem, index) => <NewsNotificationsItem key={newsItem.id} index={index} {...newsItem} />)
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
