import { getIntercom } from 'intercom-client';

import {
  ACCOUNT_NOTIFICATION_POPUP_DURATION_MS,
  getAccountNotificationAdContext,
  type NotificationInterface
} from 'lib/notifications';
import { TempleMessageType, TempleNotification } from 'lib/temple/types';
import { loadWidgetFonts } from 'lib/web-widgets/load-fonts';

import { isAccountNotificationsPopupEnabled, subscribeAccountNotificationsEnabled } from './is-enabled';
import { mountAccountNotificationPopup } from './render';

if (window.self === window.top) {
  bootstrapAccountNotificationsPopup();
}

function bootstrapAccountNotificationsPopup() {
  loadWidgetFonts();
  void getAccountNotificationAdContext().catch(() => {});

  let enabled = true;
  let unmount: EmptyFn | undefined;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;
  let surfaceActive = false;
  let remainingMs = ACCOUNT_NOTIFICATION_POPUP_DURATION_MS;
  let startedAt = 0;

  const clearHideTimer = () => {
    if (hideTimer === undefined) {
      return;
    }

    clearTimeout(hideTimer);
    hideTimer = undefined;
  };

  const startHideTimer = () => {
    if (surfaceActive) {
      return;
    }

    clearHideTimer();
    startedAt = Date.now();
    hideTimer = setTimeout(hide, remainingMs);
  };

  const hide = () => {
    clearHideTimer();
    surfaceActive = false;
    unmount?.();
    unmount = undefined;
  };

  const canShowOnThisPage = () => enabled && document.visibilityState === 'visible';

  const setSurfaceActive = (active: boolean) => {
    if (active === surfaceActive) {
      return;
    }

    if (active) {
      if (hideTimer !== undefined) {
        remainingMs = Math.max(0, remainingMs - (Date.now() - startedAt));
        clearHideTimer();
      }
      surfaceActive = true;
      return;
    }

    surfaceActive = false;
    startHideTimer();
  };

  const show = (notifications: NotificationInterface[]) => {
    if (!canShowOnThisPage() || notifications.length === 0) {
      return;
    }

    hide();
    remainingMs = ACCOUNT_NOTIFICATION_POPUP_DURATION_MS;
    unmount = mountAccountNotificationPopup(notifications, hide, setSurfaceActive);
    startHideTimer();
  };

  void isAccountNotificationsPopupEnabled().then(value => {
    enabled = value;
  });

  subscribeAccountNotificationsEnabled(value => {
    enabled = value;
    if (!enabled) {
      hide();
    }
  });

  getIntercom().subscribe((msg?: TempleNotification) => {
    if (msg?.type !== TempleMessageType.AccountNotificationReceived) {
      return;
    }

    show(msg.notifications);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') {
      hide();
    }
  });
}
