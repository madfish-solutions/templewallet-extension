import React, { useCallback } from 'react';

import { useDispatch } from 'react-redux';

import { DataPlaceholder } from 'app/atoms';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/atoms/partners-promotion';
import { useLoadPartnersPromo } from 'app/hooks/use-load-partners-promo';
import PageLayout from 'app/layouts/PageLayout';
import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { useIsEnabledAdsBannerSelector } from 'app/store/settings/selectors';
import { T } from 'lib/i18n';
import { BellIcon } from 'lib/icons';
import { useTimeout } from 'lib/ui/hooks';

import { viewAllNotificationsAction } from '../../store/actions';
import { useNotificationsSelector } from '../../store/selectors';
import { NotificationPreviewItem } from './preview-item';

const VIEW_ALL_NOTIFICATIONS_TIMEOUT = 5 * 1000;

export const Notifications = () => {
  const dispatch = useDispatch();
  const notifications = useNotificationsSelector();
  const isEnabledAdsBanner = useIsEnabledAdsBannerSelector();
  const shouldShowPartnersPromoState = useShouldShowPartnersPromoSelector();

  const viewAllNotifications = useCallback(() => void dispatch(viewAllNotificationsAction()), [dispatch]);

  useTimeout(viewAllNotifications, VIEW_ALL_NOTIFICATIONS_TIMEOUT, true, [notifications]);
  useLoadPartnersPromo();

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
        {shouldShowPartnersPromoState && !isEnabledAdsBanner && (
          <div className="pt-6 pb-4 flex justify-center">
            <PartnersPromotion variant={PartnersPromotionVariant.Image} />
          </div>
        )}
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
