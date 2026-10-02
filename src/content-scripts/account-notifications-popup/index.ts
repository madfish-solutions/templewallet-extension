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

  const hide = () => {
    if (hideTimer !== undefined) {
      clearTimeout(hideTimer);
      hideTimer = undefined;
    }

    unmount?.();
    unmount = undefined;
  };

  const canShowOnThisPage = () => enabled && document.visibilityState === 'visible' && document.hasFocus();

  const show = (notifications: NotificationInterface[]) => {
    if (!canShowOnThisPage() || notifications.length === 0) {
      return;
    }

    hide();
    unmount = mountAccountNotificationPopup(notifications, hide);
    hideTimer = setTimeout(hide, ACCOUNT_NOTIFICATION_POPUP_DURATION_MS);
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
  window.addEventListener('blur', hide);
}
