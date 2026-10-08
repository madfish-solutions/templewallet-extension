import React, { FC, useEffect } from 'react';

import { PageModal } from 'app/atoms/PageModal';
import { ScrollView } from 'app/atoms/ScrollView';
import { dispatch } from 'app/store';
import { readNotificationsItemAction } from 'app/store/notifications/actions';
import { useNotificationsItemSelector } from 'app/store/notifications/selectors';
import { setTestID } from 'lib/analytics';

import { formatGeneralDate, formatWeekdayHourDate } from '../../utils';

import { NotificationsItemContent } from './content';
import { NotificationsContentSelectors } from './selectors';

interface Props {
  id: number;
  opened: boolean;
  onRequestClose: EmptyFn;
}

export const NotificationModal: FC<Props> = ({ id, opened, onRequestClose }) => {
  const notification = useNotificationsItemSelector(id);
  useEffect(() => void dispatch(readNotificationsItemAction(notification?.id ?? 0)), [notification?.id]);

  if (notification == null) {
    return null;
  }

  return (
    <PageModal title="" opened={opened} onRequestClose={onRequestClose}>
      <ScrollView className="p-4 pb-8">
        <img src={notification.extensionImageUrl} alt="notification" className="w-full max-h-55 rounded-8" />

        <div className="flex justify-between items-center text-font-num-12 text-grey-1 mt-2 mb-4">
          <p>{formatGeneralDate(notification.createdAt)}</p>
          <p>{formatWeekdayHourDate(notification.createdAt)}</p>
        </div>

        <p
          className="text-font-regular-bold mb-2"
          {...setTestID(NotificationsContentSelectors.notificationContentTitle)}
        >
          {notification.title}
        </p>

        <NotificationsItemContent
          content={notification.content}
          testID={NotificationsContentSelectors.notificationContentDescription}
        />
      </ScrollView>
    </PageModal>
  );
};
