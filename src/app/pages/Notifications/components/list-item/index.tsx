import React, { memo, useCallback } from 'react';

import classNames from 'clsx';

import { IconBase } from 'app/atoms';
import { ReactComponent as AttentionIcon } from 'app/icons/base/attention.svg';
import { ReactComponent as NewsIcon } from 'app/icons/base/news.svg';
import { ReactComponent as UpdateIcon } from 'app/icons/base/update.svg';
import { AnalyticsEventCategory, setAnotherSelector, setTestID, useAnalytics } from 'lib/analytics';

import { NotificationStatus } from '../../enums/notification-status.enum';
import { NotificationType } from '../../enums/notification-type.enum';
import type { NotificationInterface } from '../../types';
import { formatGeneralDate, formatWeekdayHourDate } from '../../utils';

import { PreviewItemSelectors } from './selectors';

interface Props {
  notification: NotificationInterface;
  onClick?: SyncFn<number>;
}

export const ListItem = memo<Props>(({ notification, onClick }) => {
  const { trackEvent } = useAnalytics();

  const isRead = notification.status === NotificationStatus.Read;

  const handleClick = useCallback(() => {
    trackEvent(PreviewItemSelectors.notificationItem, AnalyticsEventCategory.ButtonPress, {
      id: notification.id,
      type: notification.type
    });

    return onClick?.(notification.id);
  }, [notification.id, notification.type, onClick, trackEvent]);

  return (
    <div
      className="flex flex-row p-2 gap-x-2 rounded-8 group hover:bg-secondary-low cursor-pointer mb-3"
      onClick={handleClick}
      {...setAnotherSelector('id', notification.id)}
    >
      <NotificationIcon type={notification.type} status={notification.status} />

      <div className="flex flex-1 flex-col">
        <div className="flex flex-row justify-between items-center mb-0.5">
          <p
            className={classNames('text-font-medium-bold max-w-65 max-h-5 truncate', isRead && 'text-grey-1')}
            {...setTestID(PreviewItemSelectors.notificationItemTitleText)}
          >
            {notification.title}
          </p>
          {notification.status === NotificationStatus.New && <Dot />}
        </div>

        <p
          className={classNames('text-font-description max-w-71 max-h-4 truncate mb-1', isRead && 'text-grey-1')}
          {...setTestID(PreviewItemSelectors.notificationItemDescriptionText)}
        >
          {notification.description}
        </p>

        <div className="flex flex-row justify-between text-font-num-12 text-grey-1">
          <p>{formatGeneralDate(notification.createdAt)}</p>
          <p>{formatWeekdayHourDate(notification.createdAt)}</p>
        </div>
      </div>
    </div>
  );
});

const NotificationsIconMap: Record<NotificationType, ImportedSVGComponent> = {
  [NotificationType.News]: NewsIcon,
  [NotificationType.PlatformUpdate]: UpdateIcon,
  [NotificationType.SecurityNote]: AttentionIcon
};

const NotificationIcon = memo<Pick<NotificationInterface, 'type' | 'status'>>(({ type, status }) => {
  const Icon = NotificationsIconMap[type];

  const isRead = status === NotificationStatus.Read;

  return (
    <div
      className={classNames(
        'flex justify-center items-center w-10 h-10 m-0.5 rounded-circle group-hover:bg-secondary-hover-low',
        isRead ? 'bg-grey-4' : 'bg-secondary-low'
      )}
    >
      <IconBase Icon={Icon} size={16} className={isRead ? 'text-grey-1' : 'text-secondary'} />
    </div>
  );
});

const Dot = memo(() => <div className="w-2 h-2 rounded-circle bg-secondary m-1.5" />);
