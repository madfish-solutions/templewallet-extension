import React, { FC } from 'react';

import classNames from 'clsx';

import { T } from '../../../lib/i18n/react';
import TabSwitcher from '../../atoms/TabSwitcher';
import { useAppEnv } from '../../env';
import { ReactComponent as BellGrayIcon } from '../../icons/bell-gray.svg';
import PageLayout from '../../layouts/PageLayout';
import { BakerRewardsActivity } from './ActivityNotifications/activities/BakerRewardsActivity';
import { TransactionActivity } from './ActivityNotifications/activities/TransactionActivity';
import { bakerNotifications, transactionNotifications } from './ActivityNotifications/ActivityNotifications.data';
import {
  newsNotificationsMockData,
  welcomeNewsNotificationsMockData
} from './NewsNotifications/NewsNotifications.data';
import { NewsNotificationsItem } from './NewsNotifications/NewsNotificationsItem';

const NotificationOptions = [
  {
    slug: 'activity',
    i18nKey: 'activity'
  },
  {
    slug: 'news',
    i18nKey: 'news'
  }
];

interface NotificationsProps {
  tabSlug?: string;
}

export const Notifications: FC<NotificationsProps> = ({ tabSlug = 'activity' }) => {
  const isActivity = tabSlug === 'activity';

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
        className={classNames('mt-4 mb-6', !popup && 'px-8')}
      />
      <div style={{ maxWidth: '360px', margin: 'auto' }} className="pb-8">
        <div className={popup ? 'mx-5' : ''}>
          {isActivity ? (
            <>
              <TransactionActivity key={transactionNotifications[0].id} index={0} {...transactionNotifications[0]} />
              <BakerRewardsActivity key={bakerNotifications[0].id} index={0} {...bakerNotifications[0]} />
            </>
          ) : (
            welcomeNewsNotificationsMockData
              .concat(newsNotificationsMockData)
              .map((newsItem, index) => <NewsNotificationsItem key={newsItem.id} index={index} {...newsItem} />)
          )}
        </div>
      </div>
    </PageLayout>
  );
};
