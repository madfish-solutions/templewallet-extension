import { NotificationType } from 'lib/notifications';

import {
  cursorCoveringNotifications,
  mergeNotifications,
  parsePendingAccountNotifications,
  readPersistedNotificationsCursor
} from './persisted-cursor';

const news = {
  id: 1_710_000_000_000,
  createdAt: '2024-01-01T00:00:00.000Z',
  type: NotificationType.News
};

const offer = {
  id: 5,
  createdAt: '2024-06-01T00:00:00.000Z',
  type: NotificationType.OfferReceived
};

describe('readPersistedNotificationsCursor', () => {
  it('uses the latest stored createdAt and ignores news ids for the account cursor', () => {
    const cursor = readPersistedNotificationsCursor({
      notifications: JSON.stringify({
        startFromTime: 100,
        list: { data: [news, offer] }
      })
    });

    expect(cursor).toEqual({
      startFromTime: Date.parse(offer.createdAt),
      startID: offer.id
    });
  });

  it('keeps a watermark that is already newer than stored rows', () => {
    const cursor = readPersistedNotificationsCursor({
      notifications: {
        startFromTime: Date.parse('2025-01-01T00:00:00.000Z'),
        list: { data: [offer] }
      }
    });

    expect(cursor.startFromTime).toBe(Date.parse('2025-01-01T00:00:00.000Z'));
    expect(cursor.startID).toBe(offer.id);
  });

  it('starts from the provided clock when nothing is persisted', () => {
    expect(readPersistedNotificationsCursor(null, 1_700_000_000_000)).toEqual({
      startFromTime: 1_700_000_000_000,
      startID: 0
    });
  });
});

describe('cursorCoveringNotifications', () => {
  it('requests only past rows that are already fetched', () => {
    expect(cursorCoveringNotifications({ startFromTime: 100, startID: 0 }, [news, offer])).toEqual({
      startFromTime: Date.parse(offer.createdAt),
      startID: offer.id
    });
  });
});

describe('mergeNotifications', () => {
  it('keeps earlier rows and replaces the same id with the later copy', () => {
    const updatedOffer = { ...offer, title: 'updated' };

    expect(mergeNotifications([news, offer], [updatedOffer])).toEqual([news, updatedOffer]);
  });
});

describe('parsePendingAccountNotifications', () => {
  it('keeps notification objects and drops anything else', () => {
    expect(parsePendingAccountNotifications([offer, null, { id: '5' }, 'nope'])).toEqual([offer]);
    expect(parsePendingAccountNotifications(null)).toEqual([]);
  });
});
