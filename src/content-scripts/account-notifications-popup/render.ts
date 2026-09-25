import { browser } from 'lib/browser';
import { ContentScriptType } from 'lib/constants';
import { el } from 'lib/el';
import { getNativeLocale } from 'lib/i18n/helpers';
import { msg } from 'lib/msg';
import {
  bindAccountNotificationImage,
  formatNftActivityCounts,
  getNftActivityCounts,
  type NotificationInterface
} from 'lib/notifications';

import { appendAccountNotificationAd } from './ad';
import { CLOSE_ICON, INFO_FILL_ICON, TEMPLE_LOGO_SRC, TYPE_BADGE_ICONS } from './icons';
import { ACCOUNT_NOTIFICATION_POPUP_STYLES } from './styles';

const HOST_ID = 'temple-account-notification-popup-host';
const OBJKT_BASE_URL = 'https://objkt.com';

const pluralKey = (prefix: string, count: number) => {
  const locale = getNativeLocale().replace('_', '-');

  return `${prefix}_${new Intl.PluralRules(locale).select(count)}`;
};

const setIcon = (container: HTMLElement, markup: string) => {
  container.innerHTML = markup;
};

const openWalletNotifications = () => {
  void browser.runtime.sendMessage({
    type: ContentScriptType.OpenFullPage,
    hash: '/notifications'
  });
};

const appendActivityRow = (parent: HTMLElement, notifications: NotificationInterface[], onOpen: EmptyFn) => {
  if (notifications.length === 1) {
    const notification = notifications[0];
    const row = el('div', 'row');
    row.append(buildIcon(notification.extensionImageUrl, TYPE_BADGE_ICONS[notification.type] ?? INFO_FILL_ICON));
    row.append(buildText(notification.title, notification.description));
    parent.append(row);
    return;
  }

  const row = el('a', 'row');
  row.href = OBJKT_BASE_URL;
  row.target = '_blank';
  row.rel = 'noopener noreferrer';
  row.addEventListener('click', event => {
    event.stopPropagation();
    onOpen();
  });

  const description = formatNftActivityCounts(getNftActivityCounts(notifications), (keyPrefix, count) =>
    msg(pluralKey(keyPrefix, count), String(count))
  );

  row.append(buildIcon(notifications[0].extensionImageUrl, INFO_FILL_ICON));
  row.append(buildText(msg('newNftActivities'), description, true));
  parent.append(row);
};

const buildIcon = (imageUrl: string, badgeMarkup: string) => {
  const icon = el('div', 'icon');
  const image = el('img');
  image.alt = '';
  bindAccountNotificationImage(image, imageUrl);
  icon.append(image);

  const badge = el('div', 'badge');
  setIcon(badge, badgeMarkup);
  icon.append(badge);

  return icon;
};

const buildText = (title: string, description: string, mutedDescription = false) => {
  const text = el('div', 'text');
  const titleRow = el('div', 'text-row');
  const titleNode = el('p', 'item-title');
  titleNode.textContent = title;
  titleRow.append(titleNode, el('div', 'dot'));

  const descriptionNode = el('p', mutedDescription ? 'item-description muted' : 'item-description');
  descriptionNode.textContent = description;

  text.append(titleRow, descriptionNode);

  return text;
};

export const mountAccountNotificationPopup = (notifications: NotificationInterface[], onClose: EmptyFn) => {
  document.getElementById(HOST_ID)?.remove();

  const host = el('div');
  host.id = HOST_ID;
  const shadow = host.attachShadow({ mode: 'closed' });

  const style = el('style');
  style.textContent = ACCOUNT_NOTIFICATION_POPUP_STYLES;
  shadow.append(style);

  const card = el('div', 'card');
  card.addEventListener('click', () => {
    onClose();
    openWalletNotifications();
  });

  const header = el('div', 'header');
  const logoWrap = el('div', 'logo');
  const logo = el('img');
  logo.src = TEMPLE_LOGO_SRC;
  logo.alt = '';
  logoWrap.append(logo);

  const title = el('p', 'title');
  title.textContent = msg('notifications');

  const closeButton = el('button', 'close');
  closeButton.type = 'button';
  setIcon(closeButton, CLOSE_ICON);
  closeButton.addEventListener('click', event => {
    event.stopPropagation();
    onClose();
  });

  header.append(logoWrap, title, closeButton);

  const body = el('div', 'body');
  appendActivityRow(body, notifications, onClose);
  const unbindAd = appendAccountNotificationAd(body);

  card.append(header, body);
  shadow.append(card);
  (document.body ?? document.documentElement).append(host);

  return () => {
    unbindAd();
    host.remove();
  };
};
