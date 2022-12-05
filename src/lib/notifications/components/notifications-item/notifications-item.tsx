import React, { FC, useEffect } from 'react';

import { isDefined } from '@rnw-community/shared';
import classNames from 'clsx';
import { useDispatch } from 'react-redux';

import { Button } from 'app/atoms';
import { useAppEnv } from 'app/env';
import PageLayout from 'app/layouts/PageLayout';
import { T } from 'lib/i18n';
import { BellIcon } from 'lib/icons';
import { goBack } from 'lib/woozie';

import { readNotificationsItemAction } from '../../store/actions';
import { useNotificationsItemSelector } from '../../store/selectors';
import { formatDateOutput } from '../../utils/date.utils';
import { NotificationsItemContent } from './notifications-item-content/notifications-item-content';

interface Props {
  id: number;
}

export const NotificationsItem: FC<Props> = ({ id }) => {
  const { popup } = useAppEnv();
  const dispatch = useDispatch();
  const notification = useNotificationsItemSelector(id);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => void dispatch(readNotificationsItemAction(notification?.id ?? 0)), [notification?.id]);

  if (!isDefined(notification)) {
    return null;
  }

  return (
    <PageLayout
      pageTitle={
        <>
          <BellIcon className="w-auto h-4 mr-1 stroke-current" />
          <T id="notifications" />
        </>
      }
      contentContainerStyle={{ padding: 0 }}
    >
      <div className={classNames(['max-w-sm mx-auto px-4 pb-15', popup ? 'pt-4' : 'pt-6'])}>
        <img
          src={notification.extensionImageUrl}
          className="w-full items-center rounded-md overflow-hidden bg-orange-10 mb-6"
        />
        <p className="font-inter text-gray-900 font-semibold mb-4" style={{ fontSize: 19 }}>
          {notification.title}
        </p>
        <NotificationsItemContent content={notification.content} />
        <div className="font-inter mt-4" style={{ fontSize: 10 }}>
          <p className="text-gray-500 font-normal">{formatDateOutput(notification.createdAt)}</p>
          {isDefined(notification.sourceUrl) && (
            <>
              <p className="text-gray-600 font-medium"> • </p>
              <a
                href={notification.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="uppercase font-medium text-blue-500"
              >
                READ IN ORIGINAL
              </a>
            </>
          )}
        </div>
        <Button
          className={classNames(
            'w-full mt-6',
            'mb-10',
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
    </PageLayout>
  );
};
