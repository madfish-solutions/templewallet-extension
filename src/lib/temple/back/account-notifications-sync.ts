import { Runtime } from 'webextension-polyfill';

import {
  cursorCoveringNotifications,
  mergeNotifications,
  NOTIFICATIONS_PERSIST_ROOT_KEY,
  parsePendingAccountNotifications,
  readPersistedNotificationsCursor,
  type NotificationsCursor
} from 'app/store/notifications/persisted-cursor';
import { fetchNotifications } from 'lib/apis/temple/endpoints/get-notifications';
import { ACCOUNT_NOTIFICATIONS_PENDING_STORAGE_KEY } from 'lib/constants';
import { NotificationPlatformType, NotificationStatus, type NotificationInterface } from 'lib/notifications';
import { fetchFromStorage, putToStorage, removeFromStorage } from 'lib/storage';
import { TempleMessageType } from 'lib/temple/types';

import { intercom } from './defaults';

const SYNC_DEBOUNCE_MS = 300;

const listenerCounts = new Map<Runtime.Port, number>();

let scheduledAddresses: string[] = [];
let syncTimer: ReturnType<typeof setTimeout> | undefined;
let syncGeneration = 0;
/** Rows fetched since the persisted cursor. Kept so the next request can start after them. */
let heldNotifications: NotificationInterface[] = [];
let heldAddressesKey: string | undefined;

const withStatus = (notifications: Omit<NotificationInterface, 'status'>[]): NotificationInterface[] =>
  notifications.map(notification => ({ ...notification, status: NotificationStatus.New }));

const listeningPorts = () => {
  for (const [port, count] of listenerCounts) {
    if (count <= 0 || !intercom.isConnected(port)) {
      listenerCounts.delete(port);
    }
  }

  return listenerCounts.keys();
};

let storageQueue: Promise<void> = Promise.resolve();

const enqueueStorage = <T>(task: () => Promise<T>) => {
  const run = storageQueue.then(task);
  storageQueue = run.then(
    () => undefined,
    () => undefined
  );

  return run;
};

const takePendingAccountNotifications = () =>
  enqueueStorage(async () => {
    const stored = await fetchFromStorage(ACCOUNT_NOTIFICATIONS_PENDING_STORAGE_KEY);
    if (stored == null) {
      return [];
    }

    await removeFromStorage(ACCOUNT_NOTIFICATIONS_PENDING_STORAGE_KEY);

    return parsePendingAccountNotifications(stored);
  });

const deliverAccountNotifications = (notifications: NotificationInterface[]) =>
  enqueueStorage(async () => {
    const ports = [...listeningPorts()];

    if (ports.length > 0) {
      for (const port of ports) {
        intercom.notify(port, {
          type: TempleMessageType.AccountNotificationsSync,
          notifications
        });
      }
      await removeFromStorage(ACCOUNT_NOTIFICATIONS_PENDING_STORAGE_KEY);

      return;
    }

    if (notifications.length === 0) {
      await removeFromStorage(ACCOUNT_NOTIFICATIONS_PENDING_STORAGE_KEY);

      return;
    }

    await putToStorage(ACCOUNT_NOTIFICATIONS_PENDING_STORAGE_KEY, notifications);
  });

const heldIsCoveredByStore = (persisted: NotificationsCursor, held: NotificationInterface[]) => {
  if (held.length === 0) {
    return true;
  }

  const covered = cursorCoveringNotifications(persisted, held);

  return persisted.startFromTime >= covered.startFromTime && persisted.startID >= covered.startID;
};

const loadHeldNotifications = async (accountAddresses: string[]) => {
  const addressesKey = accountAddresses.join(',');
  if (heldAddressesKey !== undefined && heldAddressesKey !== addressesKey) {
    heldNotifications = [];
    await enqueueStorage(() => removeFromStorage(ACCOUNT_NOTIFICATIONS_PENDING_STORAGE_KEY));
  }
  heldAddressesKey = addressesKey;

  if (heldNotifications.length > 0) {
    return heldNotifications;
  }

  return enqueueStorage(async () => {
    const stored = await fetchFromStorage(ACCOUNT_NOTIFICATIONS_PENDING_STORAGE_KEY);

    return parsePendingAccountNotifications(stored);
  });
};

const runAccountNotificationsSync = async (accountAddresses: string[]) => {
  if (accountAddresses.length === 0) {
    return;
  }

  const generation = ++syncGeneration;

  try {
    const root = await fetchFromStorage(NOTIFICATIONS_PERSIST_ROOT_KEY);
    if (generation !== syncGeneration) {
      return;
    }

    const persisted = readPersistedNotificationsCursor(root);
    const loadedHeld = await loadHeldNotifications(accountAddresses);
    if (generation !== syncGeneration) {
      return;
    }

    const held = heldIsCoveredByStore(persisted, loadedHeld) ? [] : loadedHeld;
    const requestCursor = cursorCoveringNotifications(persisted, held);
    const fetched = await fetchNotifications<Omit<NotificationInterface, 'status'>>({
      platform: NotificationPlatformType.Extension,
      startFromTime: requestCursor.startFromTime,
      startID: requestCursor.startID,
      accountAddresses
    });
    if (generation !== syncGeneration) {
      return;
    }

    heldNotifications = mergeNotifications(held, withStatus(fetched));
    await deliverAccountNotifications(heldNotifications);
  } catch (error) {
    console.error(error);
  }
};

/** Fetches only the gap after rows already held. The socket payload is only for the toast. */
export const scheduleAccountNotificationsSync = (accountAddresses: string[]) => {
  scheduledAddresses = accountAddresses;
  if (accountAddresses.length === 0 || syncTimer !== undefined) {
    return;
  }

  syncTimer = setTimeout(() => {
    syncTimer = undefined;
    void runAccountNotificationsSync(scheduledAddresses);
  }, SYNC_DEBOUNCE_MS);
};

export const listenForAccountNotifications = (port: Runtime.Port) => {
  listenerCounts.set(port, (listenerCounts.get(port) ?? 0) + 1);
  const unsubscribe = intercom.onDisconnect(port, () => {
    listenerCounts.delete(port);
    unsubscribe();
  });

  return takePendingAccountNotifications();
};

export const unlistenForAccountNotifications = (port: Runtime.Port) => {
  const current = listenerCounts.get(port);
  if (current === undefined) {
    return;
  }

  if (current <= 1) {
    listenerCounts.delete(port);
    return;
  }

  listenerCounts.set(port, current - 1);
};
