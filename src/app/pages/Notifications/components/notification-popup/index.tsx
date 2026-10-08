import React, { memo, MouseEventHandler, useEffect, useRef, useState } from 'react';

import clsx from 'clsx';

import { Anchor, Button, IconBase } from 'app/atoms';
import { Logo } from 'app/atoms/Logo';
import { useAppEnv } from 'app/env';
import { useThisWindowLocation } from 'app/hooks/use-this-window-location';
import { ReactComponent as InfoFillIcon } from 'app/icons/base/InfoFill.svg';
import { ReactComponent as CloseIcon } from 'app/icons/base/x.svg';
import { LAYOUT_CONTAINER_CLASSNAME } from 'app/layouts/containers';
import { dispatch } from 'app/store';
import { loadNotificationsAction } from 'app/store/notifications/actions';
import { useIsAccountNotificationsEnabledSelector } from 'app/store/notifications/selectors';
import { useShouldShowInWalletAdsSelector } from 'app/store/partners-promotion/selectors';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { setTestID } from 'lib/analytics';
import { browser } from 'lib/browser';
import { getPluralKey, t } from 'lib/i18n';
import {
  ACCOUNT_NOTIFICATION_POPUP_DURATION_MS,
  formatNftActivityCounts,
  getNftActivityCounts,
  type NotificationInterface
} from 'lib/notifications';
import { useWindowIsActive } from 'lib/temple/front/window-is-active-context';
import { TempleMessageType, TempleNotification } from 'lib/temple/types';
import { useBooleanState, useUpdatableRef } from 'lib/ui/hooks';
import { navigate } from 'lib/woozie';
import { intercomClient } from 'temple/front/intercom-client';

import { AccountNotificationImage } from '../account-notification-image';
import { ListItem } from '../list-item';

import { NotificationPopupAd } from './native-ad';
import { NotificationPopupSelectors } from './selectors';

const OBJKT_BASE_URL = 'https://objkt.com';
const FULL_PAGE_POPUP_CLASSNAME = 'fixed z-overlay top-2 right-10 w-96 max-w-[calc(100%-1rem)] pointer-events-auto';

const windowHasShownTab = async (windowId: number | null) => {
  if (windowId === null) {
    return false;
  }

  const tabs = await browser.tabs.query({ active: true, windowId }).catch(() => []);

  return tabs.length > 0;
};

export const AccountNotificationPopup = memo(() => {
  const { sidebar } = useAppEnv();
  const windowIsActive = useWindowIsActive();
  const { data: thisWindowLocation } = useThisWindowLocation();
  const isAccountNotificationsEnabled = useIsAccountNotificationsEnabledSelector();
  const canShowPopup = windowIsActive && thisWindowLocation !== undefined;
  const canShowPopupRef = useUpdatableRef(canShowPopup);
  const isAccountNotificationsEnabledRef = useUpdatableRef(isAccountNotificationsEnabled);
  const sidebarRef = useUpdatableRef(sidebar);
  const windowIdRef = useUpdatableRef(thisWindowLocation?.windowId ?? null);
  const [notifications, setNotifications] = useState<NotificationInterface[]>([]);
  const [hideTimeoutPaused, pauseHideTimeout, resumeHideTimeout] = useBooleanState(false);
  const hideTimeoutRemainingRef = useRef(ACCOUNT_NOTIFICATION_POPUP_DURATION_MS);
  const hideTimeoutNotificationsRef = useRef(notifications);

  useEffect(
    () => {
      let showRequestId = 0;

      return intercomClient.subscribe((msg: TempleNotification) => {
        if (msg?.type !== TempleMessageType.AccountNotificationReceived) {
          return;
        }

        dispatch(loadNotificationsAction.success(msg.notifications));

        if (!isAccountNotificationsEnabledRef.current) {
          return;
        }

        const requestId = ++showRequestId;
        const notificationsToShow = msg.notifications;
        const showIfStillCurrent = () => {
          if (requestId !== showRequestId || !canShowPopupRef.current) {
            return;
          }

          setNotifications(notificationsToShow);
        };

        if (!sidebarRef.current) {
          showIfStillCurrent();
          return;
        }

        void windowHasShownTab(windowIdRef.current).then(tabIsShown => {
          if (requestId !== showRequestId || tabIsShown) {
            return;
          }

          showIfStillCurrent();
        });
      });
    },
    // Refs are updated in-place; keep a single subscription for the popup lifetime.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    if (!canShowPopup) {
      setNotifications([]);
    }
  }, [canShowPopup]);

  const close = () => setNotifications([]);

  useEffect(() => {
    if (notifications.length === 0 && hideTimeoutPaused) {
      resumeHideTimeout();
    }
  }, [hideTimeoutPaused, notifications.length, resumeHideTimeout]);

  // Hover pauses the hide timer and keeps the time left. A new payload starts the full duration again.
  useEffect(() => {
    const notificationsChanged = hideTimeoutNotificationsRef.current !== notifications;
    hideTimeoutNotificationsRef.current = notifications;

    if (notificationsChanged) {
      hideTimeoutRemainingRef.current = ACCOUNT_NOTIFICATION_POPUP_DURATION_MS;
    }

    if (notifications.length === 0 || hideTimeoutPaused) {
      return;
    }

    const startedAt = Date.now();
    const timeoutId = setTimeout(() => setNotifications([]), hideTimeoutRemainingRef.current);

    return () => {
      clearTimeout(timeoutId);
      hideTimeoutRemainingRef.current = Math.max(0, hideTimeoutRemainingRef.current - (Date.now() - startedAt));
    };
  }, [hideTimeoutPaused, notifications]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <NotificationPopupCard
      notifications={notifications}
      onClose={close}
      onMouseEnter={pauseHideTimeout}
      onMouseLeave={resumeHideTimeout}
    />
  );
});

interface CardProps {
  notifications: NotificationInterface[];
  onClose: EmptyFn;
  onMouseEnter: MouseEventHandler<HTMLDivElement>;
  onMouseLeave: MouseEventHandler<HTMLDivElement>;
}

const getPopupOverlayTopClassName = (testnetModeEnabled: boolean) => (testnetModeEnabled ? 'top-8' : 'top-2');

const NotificationPopupCard = memo<CardProps>(({ notifications, onClose, onMouseEnter, onMouseLeave }) => {
  const { fullPage } = useAppEnv();
  const testnetModeEnabled = useTestnetModeEnabledSelector();
  const shouldShowPartnersPromo = useShouldShowInWalletAdsSelector();

  const openNotificationsPage = () => {
    onClose();
    navigate('/notifications');
  };

  const handleCloseClick: MouseEventHandler<HTMLButtonElement> = event => {
    event.stopPropagation();
    onClose();
  };

  const handleAdsClick: MouseEventHandler<HTMLDivElement> = event => {
    event.stopPropagation();
  };

  const card = (
    <div
      className="bg-background rounded-8 shadow-bottom overflow-hidden cursor-pointer"
      onClick={openNotificationsPage}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...setTestID(NotificationPopupSelectors.card)}
    >
      <div className="flex items-center gap-1 p-4">
        <div className="flex items-center justify-center size-6 shrink-0">
          <Logo type="icon" size={20} />
        </div>
        <p className="flex-1 min-w-0 text-font-medium-bold truncate">{t('notifications')}</p>
        <Button className="shrink-0" onClick={handleCloseClick} testID={NotificationPopupSelectors.closeButton}>
          <IconBase Icon={CloseIcon} className="text-grey-2" />
        </Button>
      </div>

      <div className="flex flex-col gap-1 px-1 pb-1">
        {notifications.length === 1 ? (
          <ListItem notification={notifications[0]} compact />
        ) : (
          <NftActivitiesSummary notifications={notifications} onOpen={onClose} />
        )}

        {shouldShowPartnersPromo && (
          <div onClick={handleAdsClick}>
            <NotificationPopupAd />
          </div>
        )}
      </div>
    </div>
  );

  if (fullPage) {
    return <div className={FULL_PAGE_POPUP_CLASSNAME}>{card}</div>;
  }

  return (
    <div
      className={clsx(
        'fixed z-overlay inset-x-0 flex justify-center pointer-events-none',
        getPopupOverlayTopClassName(testnetModeEnabled)
      )}
    >
      <div className={clsx(LAYOUT_CONTAINER_CLASSNAME, 'px-2 pointer-events-auto')}>{card}</div>
    </div>
  );
});

interface SummaryProps {
  notifications: NotificationInterface[];
  onOpen: EmptyFn;
}

const NftActivitiesSummary = memo<SummaryProps>(({ notifications, onOpen }) => {
  const description = formatNftActivityCounts(getNftActivityCounts(notifications), (keyPrefix, count) =>
    t(getPluralKey(keyPrefix, count), String(count))
  );

  const handleClick: MouseEventHandler<HTMLAnchorElement> = event => {
    event.stopPropagation();
    onOpen();
  };

  return (
    <Anchor
      href={OBJKT_BASE_URL}
      className="flex flex-row items-center p-2 gap-x-2 rounded-8 group hover:bg-secondary-low"
      testID={NotificationPopupSelectors.activitiesSummary}
      onClick={handleClick}
    >
      <div className="relative flex justify-center items-center size-11 shrink-0">
        <AccountNotificationImage
          src={notifications[0].extensionImageUrl}
          className="w-[83.3333%] aspect-square rounded-circle object-cover"
        />
        <div
          className={clsx(
            'absolute right-0 bottom-0 flex items-center justify-center',
            'size-5 rounded-circle bg-white border-[0.8px] border-lines'
          )}
        >
          <IconBase Icon={InfoFillIcon} size={12} className="text-secondary" iconTransform="scale(0.875)" />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-row justify-between items-center">
          <p className="min-w-0 flex-1 text-font-medium-bold max-h-5 truncate">{t('newNftActivities')}</p>
          <div className="w-2 h-2 rounded-circle bg-secondary m-1.5" />
        </div>
        <p className="min-w-0 text-font-description text-grey-1 max-h-4 truncate">{description}</p>
      </div>
    </Anchor>
  );
});
