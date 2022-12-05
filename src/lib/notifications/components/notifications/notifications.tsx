import React, { useEffect } from 'react';

import { useDispatch } from 'react-redux';

import { DataPlaceholder } from 'app/atoms';
import PageLayout from 'app/layouts/PageLayout';
import { T } from 'lib/i18n';
import { BellIcon } from 'lib/icons';

import { viewAllNotificationsAction } from '../../store/actions';
import { useNotificationsSelector } from '../../store/selectors';
import { NotificationPreviewItem } from './notifications-preview-item/notifications-preview-item';

const VIEW_ALL_NOTIFICATIONS_TIMEOUT = 5 * 1000;

export const Notifications = () => {
  const dispatch = useDispatch();
  const notifications = useNotificationsSelector();

  useEffect(() => {
    const timer = setTimeout(() => void dispatch(viewAllNotificationsAction()), VIEW_ALL_NOTIFICATIONS_TIMEOUT);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

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
      <div className="max-w-sm mx-auto pb-15">
        {notifications.length === 0 ? (
          <DataPlaceholder id="notificationsNotFound" />
        ) : (
          notifications.map(notification => (
            <NotificationPreviewItem key={notification.id} notification={notification} />
          ))
        )}
      </div>
    </PageLayout>
  );
};
