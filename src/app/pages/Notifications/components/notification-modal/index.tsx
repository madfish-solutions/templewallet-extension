import React, { FC, useEffect } from 'react';

import { isDefined } from '@rnw-community/shared';
import classNames from 'clsx';

import { Button } from 'app/atoms';
import { PageModal } from 'app/atoms/PageModal';
import { useAppEnv } from 'app/env';
import { dispatch } from 'app/store';
import { readNotificationsItemAction } from 'app/store/notifications/actions';
import { useNotificationsItemSelector } from 'app/store/notifications/selectors';
import { setTestID } from 'lib/analytics';
import { T } from 'lib/i18n';
import { goBack } from 'lib/woozie';

import { formatGeneralDate } from '../../utils';

import { NotificationsItemContent } from './content';
import { NotificationsContentSelectors } from './selectors';

interface Props {
  id: number;
  opened: boolean;
  onRequestClose: EmptyFn;
}

export const NotificationModal: FC<Props> = ({ id, opened, onRequestClose }) => {
  const { popup } = useAppEnv();
  const notification = useNotificationsItemSelector(id);
  useEffect(() => void dispatch(readNotificationsItemAction(notification?.id ?? 0)), [notification?.id]);

  if (notification == null) {
    return null;
  }

  return (
    <PageModal title="" opened={opened} onRequestClose={onRequestClose}>
      <div className={classNames(['max-w-sm mx-auto px-4 pb-15', popup ? 'pt-4' : 'pt-6'])}>
        <img
          src={notification.extensionImageUrl}
          alt="Notification"
          className="w-full items-center rounded-md overflow-hidden bg-primary-low mb-6"
        />
        <p
          className="font-inter text-gray-900 font-semibold mb-4"
          style={{ fontSize: 19 }}
          {...setTestID(NotificationsContentSelectors.notificationContentTitle)}
        >
          {notification.title}
        </p>
        <NotificationsItemContent
          content={notification.content}
          testID={NotificationsContentSelectors.notificationContentDescription}
        />
        <div className="font-inter mt-4" style={{ fontSize: 10 }}>
          <p className="text-gray-500 font-normal">{formatGeneralDate(notification.createdAt)}</p>
          {isDefined(notification.sourceUrl) && (
            <>
              <p className="text-gray-600 font-medium"> • </p>
              <a
                href={notification.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="uppercase font-medium text-blue-500"
              >
                <T id="readInOriginal" />
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
          testID={NotificationsContentSelectors.gotItButton}
        >
          <T id="okGotIt" />
        </Button>
      </div>
    </PageModal>
  );
};
