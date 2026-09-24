import React, { memo, useCallback } from 'react';

import classNames from 'clsx';

import { Anchor, IconBase } from 'app/atoms';
import { ReactComponent as AttentionIcon } from 'app/icons/base/attention.svg';
import { ReactComponent as BidFillIcon } from 'app/icons/base/bid-fill.svg';
import { ReactComponent as NewsIcon } from 'app/icons/base/news.svg';
import { ReactComponent as OfferFillIcon } from 'app/icons/base/offer-fill.svg';
import { ReactComponent as SoldFillIcon } from 'app/icons/base/sold-fill.svg';
import { ReactComponent as UpdateIcon } from 'app/icons/base/update.svg';
import { AnalyticsEventCategory, setAnotherSelector, setTestID, useAnalytics } from 'lib/analytics';

import { NotificationStatus } from '../../enums/notification-status.enum';
import {
  AccountNotificationType,
  isAccountNotificationType,
  NotificationType
} from '../../enums/notification-type.enum';
import type { NotificationInterface } from '../../types';
import { formatGeneralDate, formatWeekdayHourDate } from '../../utils';

import { PreviewItemSelectors } from './selectors';

interface Props {
  notification: NotificationInterface;
  onClick?: (id: number, externalHref?: string) => void;
  /** Same row as the notifications page, without the date. Popup uses only the New state. */
  compact?: boolean;
}

const LIST_ITEM_CLASSNAME = 'flex flex-row p-2 gap-x-2 rounded-8 group hover:bg-secondary-low';

export const ListItem = memo<Props>(({ notification, onClick, compact = false }) => {
  const { trackEvent } = useAnalytics();

  const isRead = notification.status === NotificationStatus.Read;

  const handleClick = useCallback((sourceUrl?: string) => {
    trackEvent(PreviewItemSelectors.notificationItem, AnalyticsEventCategory.ButtonPress, {
      id: notification.id,
      type: notification.type
    });

    return onClick?.(notification.id, sourceUrl);
  }, [notification.id, notification.type, onClick, trackEvent]);

  const handleGeneralNotificationClick = useCallback(() => {
    handleClick();
  }, [handleClick]);

  const handleAccountNotificationClick = useCallback(() => {
    handleClick(notification.sourceUrl);
  }, [handleClick, notification.sourceUrl]);

  const innerContent = (
    <>
      <NotificationIcon
        type={notification.type}
        status={notification.status}
        extensionImageUrl={notification.extensionImageUrl}
      />

      <div className={classNames('flex min-w-0 flex-1 flex-col', compact && 'gap-1')}>
        <div className={classNames('flex flex-row justify-between items-center', !compact && 'mb-0.5')}>
          <p
            className={classNames('min-w-0 flex-1 text-font-medium-bold max-h-5 truncate', isRead && 'text-grey-1')}
            {...setTestID(PreviewItemSelectors.notificationItemTitleText)}
          >
            {notification.title}
          </p>
          {notification.status === NotificationStatus.New && <Dot />}
        </div>

        <p
          className={classNames(
            'min-w-0 text-font-description max-h-4 truncate',
            !compact && 'mb-1',
            isRead && 'text-grey-1'
          )}
          {...setTestID(PreviewItemSelectors.notificationItemDescriptionText)}
        >
          {notification.description}
        </p>

        {!compact && (
          <div className="flex flex-row justify-between text-font-num-12 text-grey-1">
            <p>{formatGeneralDate(notification.createdAt)}</p>
            <p>{formatWeekdayHourDate(notification.createdAt)}</p>
          </div>
        )}
      </div>
    </>
  );

  const className = classNames(LIST_ITEM_CLASSNAME, !compact && 'cursor-pointer mb-3');

  if (!compact && isAccountNotificationType(notification.type) && notification.sourceUrl) {
    return (
      <Anchor
        href={notification.sourceUrl}
        className={className}
        testID={PreviewItemSelectors.notificationItem}
        onClick={handleAccountNotificationClick}
        {...setAnotherSelector('id', notification.id)}
      >
        {innerContent}
      </Anchor>
    );
  }

  return (
    <div
      className={className}
      onClick={compact ? undefined : handleGeneralNotificationClick}
      {...setAnotherSelector('id', notification.id)}
    >
      {innerContent}
    </div>
  );
});

const NotificationsIconMap: Record<Exclude<NotificationType, AccountNotificationType>, ImportedSVGComponent> = {
  [NotificationType.News]: NewsIcon,
  [NotificationType.PlatformUpdate]: UpdateIcon,
  [NotificationType.SecurityNote]: AttentionIcon
};

const NotificationIcon = memo<Pick<NotificationInterface, 'type' | 'status' | 'extensionImageUrl'>>(
  ({ type, status, extensionImageUrl }) => {
    const isRead = status === NotificationStatus.Read;

    if (isAccountNotificationType(type)) {
      return <AccountNotificationIcon src={extensionImageUrl} isRead={isRead} type={type} />;
    }

    const Icon = NotificationsIconMap[type];

    return (
      <div
        className={classNames(
          'flex shrink-0 justify-center items-center size-10 m-0.5 rounded-circle',
          'group-hover:bg-secondary-hover-low',
          isRead ? 'bg-grey-4' : 'bg-secondary-low'
        )}
      >
        <IconBase Icon={Icon} size={16} className={isRead ? 'text-grey-1' : 'text-secondary'} />
      </div>
    );
  }
);

const icons: Record<AccountNotificationType, ImportedSVGComponent> = {
  [NotificationType.AuctionBid]: BidFillIcon,
  [NotificationType.OfferReceived]: OfferFillIcon,
  [NotificationType.NftSold]: SoldFillIcon
};

const AccountNotificationIcon = memo<{ src: string; isRead: boolean; type: AccountNotificationType }>(
  ({ src, isRead, type }) => (
    <div className="relative flex justify-center items-center size-11 shrink-0">
      <img
        src={src}
        alt=""
        className={classNames('w-[83.3333%] aspect-square rounded-circle object-cover', isRead && 'grayscale')}
      />
      <div
        className={classNames(
          'absolute right-0 bottom-0 flex items-center justify-center',
          'size-5 rounded-circle bg-white border-[0.8px] border-lines'
        )}
      >
        <IconBase
          Icon={icons[type]}
          size={12}
          className={isRead ? 'text-grey-1' : 'text-secondary'}
          iconTransform="scale(0.875)"
        />
      </div>
    </div>
  )
);

const Dot = () => <div className="w-2 h-2 rounded-circle bg-secondary m-1.5" />;
