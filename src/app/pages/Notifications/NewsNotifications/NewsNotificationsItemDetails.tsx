import React, { FC } from 'react';

import classNames from 'clsx';

import { T } from 'lib/i18n/react';
import { goBack } from 'lib/woozie';

import { Button } from '../../../atoms/Button';
import { useAppEnv } from '../../../env';
import { ReactComponent as BellGrayIcon } from '../../../icons/bell-gray.svg';
import PageLayout from '../../../layouts/PageLayout';
import { useNews } from '../use-news.hook';
import { formatDate } from '../utils/formatDate';
import { welcomeNewsNotificationsMockData } from './NewsNotifications.data';

interface NewsNotificationsItemDetailsProps {
  id: string;
}

export const NewsNotificationsItemDetails: FC<NewsNotificationsItemDetailsProps> = ({ id }) => {
  const { popup } = useAppEnv();

  const { news } = useNews();

  const newsItem = [...welcomeNewsNotificationsMockData, ...news].find(newsItem => newsItem.id === id)!;

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
      <div style={{ maxWidth: '360px', margin: 'auto' }} className="pb-8">
        <div className={popup ? 'mx-5' : ''}>
          <img src={newsItem.extensionImageUrl} alt="newsImage" className="w-full my-6" style={{ borderRadius: 10 }} />
          <div className="font-inter text-gray-900 font-semibold mb-8" style={{ fontSize: 23 }}>
            {newsItem.description}
          </div>
          <div className="font-inter text-gray-900 font-normal" style={{ fontSize: 17 }}>
            {newsItem.description}
          </div>
          <div className="font-inter mt-7" style={{ fontSize: 10 }}>
            <span className="text-gray-500 font-normal">{formatDate(newsItem.createdAt)}</span>
            <span className="text-gray-600 font-medium mx-1">•</span>
            <a
              href={newsItem.readInOriginalUrl}
              target="_blank"
              rel="noreferrer"
              className="uppercase font-medium text-blue-500"
            >
              <T id="readInOriginal" />
            </a>
          </div>
          <Button
            className={classNames(
              'w-full mt-12',
              popup ? 'mb-6' : 'mb-10',
              'rounded border-2',
              'bg-primary-orange border-primary-orange',
              'flex justify-center items-center',
              'text-primary-orange-lighter',
              'font-inter font-semibold',
              'transition duration-200 ease-in-out',
              'opacity-90 hover:opacity-100 focus:opacity-100',
              'shadow-sm hover:shadow focus:shadow'
            )}
            style={{
              paddingTop: '0.6rem',
              paddingBottom: '0.6rem',
              fontSize: 17
            }}
            onClick={goBack}
          >
            <T id="okGotIt" />
          </Button>
        </div>
      </div>
    </PageLayout>
  );
};
