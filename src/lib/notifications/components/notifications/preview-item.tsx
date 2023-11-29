import React, { FC } from 'react';

import classNames from 'clsx';

import { AlertTriangleIcon, ArrowRightIcon, NewsIcon, NotificationDotIcon, UpdateIcon } from 'lib/icons';
import { Link } from 'lib/woozie';

import { setAnotherSelector, setTestID } from '../../../analytics';
import { NotificationStatus } from '../../enums/notification-status.enum';
import { NotificationType } from '../../enums/notification-type.enum';
import type { NotificationInterface } from '../../types';
import { formatDateOutput } from '../../utils/date.utils';
import { PreviewItemSelectors } from './preview-item.selectors';

const NotificationsIconMap: Record<NotificationType, ImportedSVGComponent> = {
  [NotificationType.News]: NewsIcon,
  [NotificationType.PlatformUpdate]: UpdateIcon,
  [NotificationType.SecurityNote]: AlertTriangleIcon
};

interface Props {
  notification: NotificationInterface;
}

export const NotificationPreviewItem: FC<Props> = ({ notification }) => {
  const Icon = NotificationsIconMap[notification.type];

  return (
    <Link
      to={`/notifications/${notification.id}`}
      className={classNames([
        'flex column p-4 border-b border-gray-300',
        notification.status === NotificationStatus.Read && 'bg-gray-10'
      ])}
      testID={PreviewItemSelectors.notificationItem}
      testIDProperties={{ id: notification.id, type: notification.type }}
      {...setAnotherSelector('id', notification.id)}
    >
      <div className="relative">
        {notification.status === NotificationStatus.New && (
          <NotificationDotIcon
            width={8}
            height={8}
            stroke="#FFFFFF"
            style={{
              position: 'absolute',
              zIndex: 1,
              top: 0,
              right: 0
            }}
          />
        )}

        <Icon width={24} height={24} stroke="#718096" />
      </div>

      <div className="flex flex-1 flex-col justify-between ml-3">
        <div className="mb-4">
          <p
            className={classNames(
              'mb-2 text-sm font-medium',
              notification.status === NotificationStatus.Read ? 'text-gray-600' : 'text-black'
            )}
            {...setTestID(PreviewItemSelectors.notificationItemTitleText)}
          >
            {notification.title}
          </p>

          <p className="text-gray-600 text-xs" {...setTestID(PreviewItemSelectors.notificationItemDescriptionText)}>
            {notification.description}
          </p>
        </div>

        <div className="flex row justify-between items-center">
          <p className="text-gray-500 font-normal" style={{ fontSize: 10 }}>
            {formatDateOutput(notification.createdAt)}
          </p>

          <div className="flex row items-center">
            <p className="mr-1 font-medium font-inter text-xs text-primary-orange">Details</p>
            <ArrowRightIcon width={16} height={16} />
          </div>
        </div>
      </div>
    </Link>
  );
};
