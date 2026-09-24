import { NotificationStatus } from 'app/pages/Notifications/enums/notification-status.enum';
import type { NotificationInterface } from 'app/pages/Notifications/types';
import {
  ACCOUNT_NOTIFICATION_POPUP_DURATION_MS,
  getTezosNotificationAccountAddresses
} from 'app/store/notifications/utils';
import {
  buildAccountNotificationsWsUrl,
  parseAccountNotificationWsMessage
} from 'lib/apis/temple/endpoints/account-notifications-ws';
import { EnvVars } from 'lib/env';
import { StoredAccount, TempleMessageType, TempleStatus } from 'lib/temple/types';

import { intercom } from './defaults';
import { accountsUpdated, locked, store, unlocked } from './store';

const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 30_000;

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
let reconnectAttempt = 0;
let desiredAddresses: string[] = [];
let lastSentAddressesKey = '';
let manuallyClosed = false;
let started = false;
let popupBurst: NotificationInterface[] = [];
let popupBurstTimer: ReturnType<typeof setTimeout> | undefined;

const getReconnectDelay = () => Math.min(RECONNECT_BASE_DELAY_MS * 2 ** reconnectAttempt, RECONNECT_MAX_DELAY_MS);

const addressesKey = (accountAddresses: string[]) => accountAddresses.join(',');

const sendAccountAddresses = (accountAddresses: string[]) => {
  const currentSocket = socket;
  if (currentSocket?.readyState !== WebSocket.OPEN) {
    return;
  }

  const nextKey = addressesKey(accountAddresses);
  if (nextKey === lastSentAddressesKey) {
    return;
  }

  currentSocket.send(JSON.stringify({ type: 'setAccountAddresses', accountAddresses }));
  lastSentAddressesKey = nextKey;
};

const clearReconnectTimer = () => {
  if (reconnectTimer !== undefined) {
    clearTimeout(reconnectTimer);
    reconnectTimer = undefined;
  }
};

const clearPopupBurst = () => {
  if (popupBurstTimer !== undefined) {
    clearTimeout(popupBurstTimer);
    popupBurstTimer = undefined;
  }
  popupBurst = [];
};

const rememberForPopupBurst = (notification: NotificationInterface) => {
  if (!popupBurst.some(item => item.id === notification.id)) {
    popupBurst = [...popupBurst, notification];
  }

  if (popupBurstTimer !== undefined) {
    clearTimeout(popupBurstTimer);
  }

  popupBurstTimer = setTimeout(clearPopupBurst, ACCOUNT_NOTIFICATION_POPUP_DURATION_MS);

  return popupBurst;
};

const disconnectSocket = () => {
  manuallyClosed = true;
  clearReconnectTimer();
  clearPopupBurst();
  lastSentAddressesKey = '';
  reconnectAttempt = 0;

  if (!socket) {
    return;
  }

  const currentSocket = socket;
  socket = null;
  currentSocket.close();
};

const scheduleReconnect = () => {
  if (manuallyClosed || reconnectTimer !== undefined) {
    return;
  }

  const delay = getReconnectDelay();
  reconnectAttempt += 1;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = undefined;
    openSocket();
  }, delay);
};

const handleMessage = (event: MessageEvent<string>) => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(event.data);
  } catch {
    return;
  }

  const notification = parseAccountNotificationWsMessage(parsed);
  if (!notification) {
    return;
  }

  const notificationWithStatus: NotificationInterface = {
    ...notification,
    status: NotificationStatus.New
  };

  intercom.broadcast({
    type: TempleMessageType.AccountNotificationReceived,
    notifications: rememberForPopupBurst(notificationWithStatus)
  });
};

const openSocket = () => {
  if (
    manuallyClosed ||
    (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING))
  ) {
    return;
  }

  const nextSocket = new WebSocket(buildAccountNotificationsWsUrl(EnvVars.TEMPLE_WALLET_API_URL));
  socket = nextSocket;
  lastSentAddressesKey = '';

  nextSocket.addEventListener('open', () => {
    if (socket !== nextSocket) {
      return;
    }

    reconnectAttempt = 0;
    sendAccountAddresses(desiredAddresses);
  });

  nextSocket.addEventListener('message', handleMessage);

  nextSocket.addEventListener('close', () => {
    if (socket === nextSocket) {
      socket = null;
      lastSentAddressesKey = '';
    }

    if (!manuallyClosed) {
      scheduleReconnect();
    }
  });

  nextSocket.addEventListener('error', () => {
    nextSocket.close();
  });
};

const syncAccountAddresses = (accounts: StoredAccount[]) => {
  desiredAddresses = getTezosNotificationAccountAddresses(accounts);
  sendAccountAddresses(desiredAddresses);
};

const connectForAccounts = (accounts: StoredAccount[]) => {
  manuallyClosed = false;
  syncAccountAddresses(accounts);
  openSocket();
};

export const startAccountNotificationsWebSocket = () => {
  if (started) {
    return;
  }

  started = true;

  unlocked.watch(({ accounts }) => connectForAccounts(accounts));
  accountsUpdated.watch(accounts => {
    if (store.getState().status !== TempleStatus.Ready) {
      return;
    }

    syncAccountAddresses(accounts);
    openSocket();
  });
  locked.watch(disconnectSocket);

  const state = store.getState();
  if (state.status === TempleStatus.Ready) {
    connectForAccounts(state.accounts);
  }
};
