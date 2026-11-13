import { NotificationPlatformType, NotificationType } from 'lib/notifications';

import { buildAccountNotificationsWsUrl, parseAccountNotificationWsMessage } from './account-notifications-ws';

const notification = {
  id: 42,
  createdAt: '2020-01-01T00:00:00.000Z',
  type: NotificationType.OfferReceived,
  platforms: [NotificationPlatformType.Extension],
  language: 'en-US',
  title: 'New offer for 1 tez',
  description: 'On Tezzard',
  content: ['On Tezzard'],
  extensionImageUrl: 'https://icon.test',
  mobileImageUrl: 'https://icon.test',
  accountAddresses: ['tz1fVQangAfb9J1hRRMP2bSB6LvASD6KpY8A']
};

describe('account notifications websocket helpers', () => {
  it('builds a websocket URL from the HTTP API origin', () => {
    expect(buildAccountNotificationsWsUrl('http://localhost:3001')).toBe('ws://localhost:3001/api/notifications');
    expect(buildAccountNotificationsWsUrl('https://api.example.com/v1')).toBe(
      'wss://api.example.com/api/notifications'
    );
  });

  it('parses a notification event and ignores other payloads', () => {
    expect(parseAccountNotificationWsMessage({ type: 'notification', notification })).toEqual(notification);
    expect(parseAccountNotificationWsMessage({ type: 'subscribed', accountAddresses: [] })).toBeNull();
    expect(
      parseAccountNotificationWsMessage({
        type: 'notification',
        notification: { ...notification, type: NotificationType.News }
      })
    ).toBeNull();
  });
});
