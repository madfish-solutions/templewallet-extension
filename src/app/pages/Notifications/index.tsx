import React, { useCallback, useState } from 'react';

import { PageTitle } from 'app/atoms';
import { EmptyState } from 'app/atoms/EmptyState';
import PageLayout from 'app/layouts/PageLayout';
import { dispatch } from 'app/store';
import { viewAllNotificationsAction } from 'app/store/notifications/actions';
import { useNotificationsSelector } from 'app/store/notifications/selectors';
import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { usePartnersPromotionModule } from 'app/templates/partners-promotion';
import { t } from 'lib/i18n';
import { useBooleanState, useTimeout } from 'lib/ui/hooks';

import { ListItem } from './components/list-item';
import { NotificationModal } from './components/notification-modal';

const VIEW_ALL_NOTIFICATIONS_TIMEOUT = 5 * 1000;

export const Notifications = () => {
  const [selectedNotificationId, setSelectedNotificationId] = useState(0);
  const [notificationModalOpened, setNotificationModalOpen, setNotificationModalClosed] = useBooleanState(false);

  const notifications = useNotificationsSelector();
  const shouldShowPartnersPromoState = useShouldShowPartnersPromoSelector();
  const PartnersPromotionModule = usePartnersPromotionModule();

  const viewAllNotifications = useCallback(() => void dispatch(viewAllNotificationsAction()), []);

  useTimeout(viewAllNotifications, VIEW_ALL_NOTIFICATIONS_TIMEOUT, true, [notifications]);

  const handleItemClick = useCallback(
    (id: number) => {
      setSelectedNotificationId(id);
      setNotificationModalOpen();
    },
    [setNotificationModalOpen]
  );

  return (
    <>
      <PageLayout pageTitle={<PageTitle title={t('notifications')} />} contentClassName="pb-1!">
        {shouldShowPartnersPromoState && PartnersPromotionModule && (
          <div className="mb-4 flex justify-center">
            <PartnersPromotionModule.PartnersPromotion
              id="promo-notifications-item"
              variant={PartnersPromotionModule.PartnersPromotionVariant.Image}
              pageName="Notifications"
            />
          </div>
        )}

        {notifications.length === 0 ? (
          <EmptyState stretch forSearch={false} textI18n="noNotificationsYet" />
        ) : (
          notifications.map(notification => (
            <ListItem key={notification.id} notification={notification} onClick={handleItemClick} />
          ))
        )}
      </PageLayout>

      <NotificationModal
        id={selectedNotificationId}
        opened={notificationModalOpened}
        onRequestClose={setNotificationModalClosed}
      />
    </>
  );
};
