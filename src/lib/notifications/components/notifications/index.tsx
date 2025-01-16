import React, { useCallback } from 'react';

import { DataPlaceholder, IconBase } from 'app/atoms';
import { ReactComponent as BellIcon } from 'app/icons/base/bell.svg';
import PageLayout from 'app/layouts/PageLayout';
import { dispatch } from 'app/store';
import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/templates/partners-promotion';
import { T } from 'lib/i18n';
import { useTimeout } from 'lib/ui/hooks';

import { viewAllNotificationsAction } from '../../store/actions';
import { useNotificationsSelector } from '../../store/selectors';

import { NotificationPreviewItem } from './preview-item';

const VIEW_ALL_NOTIFICATIONS_TIMEOUT = 5 * 1000;

export const Notifications = () => {
  const notifications = useNotificationsSelector();
  const shouldShowPartnersPromoState = useShouldShowPartnersPromoSelector();

  const viewAllNotifications = useCallback(() => void dispatch(viewAllNotificationsAction()), []);

  useTimeout(viewAllNotifications, VIEW_ALL_NOTIFICATIONS_TIMEOUT, true, [notifications]);

  return (
    <PageLayout
      pageTitle={
        <>
          <IconBase Icon={BellIcon} size={16} className="mr-1" />
          <T id="notifications" />
        </>
      }
    >
      {shouldShowPartnersPromoState && (
        <div className="mb-4 flex justify-center">
          <PartnersPromotion
            id="promo-notifications-item"
            variant={PartnersPromotionVariant.Image}
            pageName="Notifications"
          />
        </div>
      )}

      {notifications.length === 0 ? (
        <DataPlaceholder id="notificationsNotFound" />
      ) : (
        notifications.map(notification => <NotificationPreviewItem key={notification.id} notification={notification} />)
      )}
    </PageLayout>
  );
};
