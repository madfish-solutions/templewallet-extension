// (!) Contains side-effects.

import browser from 'webextension-polyfill';

import { NEVER_AUTOLOCK_VALUE, SHOULD_BACKUP_MNEMONIC_STORAGE_KEY } from 'lib/constants';
import { getLockUpTimeout } from 'lib/lock-up';
import { fetchFromStorage } from 'lib/storage';
import { TempleMessageType } from 'lib/temple/types';
import { makeIntercomRequest } from 'temple/front/intercom-client';

export const CLOSURE_STORAGE_KEY = 'last-page-closure-timestamp';

const isSinglePageOpened = () => getOpenedTemplePagesN() === 1;

export async function getShouldBeLockedOnStartup(didMount: boolean) {
  if (!isSinglePageOpened()) {
    return false;
  }

  const closureTimestamp = Number(localStorage.getItem(CLOSURE_STORAGE_KEY));
  const [shouldBackupMnemonic, autoLockTime] = await Promise.all([
    fetchFromStorage<boolean>(SHOULD_BACKUP_MNEMONIC_STORAGE_KEY).catch(() => false),
    getLockUpTimeout()
  ]);

  const shouldLockByTimeout = closureTimestamp && Date.now() - closureTimestamp >= autoLockTime;

  return shouldLockByTimeout || (!didMount && shouldBackupMnemonic);
}

let lockTimeout: ReturnType<typeof setTimeout> | undefined;
let inactivityTimeout: ReturnType<typeof setTimeout> | undefined;

const scheduleLock = async () => {
  if (!isSinglePageOpened()) return;
  const autoLockTime = await getLockUpTimeout();

  if (autoLockTime === NEVER_AUTOLOCK_VALUE) return;
  if (lockTimeout) clearTimeout(lockTimeout);

  lockTimeout = setTimeout(() => void makeIntercomRequest({ type: TempleMessageType.LockRequest }), autoLockTime);
};

const cancelScheduledLock = () => {
  if (lockTimeout) {
    clearTimeout(lockTimeout);
    lockTimeout = undefined;
  }
};

const scheduleInactivityLock = async () => {
  if (!isSinglePageOpened()) return;

  const autoLockTime = await getLockUpTimeout();
  if (autoLockTime === NEVER_AUTOLOCK_VALUE) return;

  if (inactivityTimeout) clearTimeout(inactivityTimeout);
  inactivityTimeout = setTimeout(() => void makeIntercomRequest({ type: TempleMessageType.LockRequest }), autoLockTime);
};

const cancelInactivityLock = () => {
  if (inactivityTimeout) {
    clearTimeout(inactivityTimeout);
    inactivityTimeout = undefined;
  }
};

document.addEventListener(
  'visibilitychange',
  async () => {
    if (document.visibilityState === 'hidden') {
      cancelInactivityLock();
      localStorage.setItem(CLOSURE_STORAGE_KEY, Date.now().toString());
      await scheduleLock();
    } else if (document.visibilityState === 'visible') {
      cancelScheduledLock();
      localStorage.removeItem(CLOSURE_STORAGE_KEY);
      await scheduleInactivityLock();
    }
  },
  true
);

window.addEventListener(
  'blur',
  async () => {
    cancelInactivityLock();
    localStorage.setItem(CLOSURE_STORAGE_KEY, Date.now().toString());
    await scheduleLock();
  },
  true
);

window.addEventListener(
  'focus',
  () => {
    cancelScheduledLock();
    cancelInactivityLock();
    localStorage.removeItem(CLOSURE_STORAGE_KEY);
    void scheduleInactivityLock();
  },
  true
);

const onUserActivity = () => {
  localStorage.removeItem(CLOSURE_STORAGE_KEY);
  cancelScheduledLock();
  cancelInactivityLock();
  void scheduleInactivityLock();
};

['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel'].forEach(eventName => {
  window.addEventListener(eventName, onUserActivity, true);
});

function getOpenedTemplePagesN() {
  const windowsN = browser.extension.getViews().length;
  const bgWindow: Window | null = browser.extension.getBackgroundPage();
  return bgWindow ? windowsN - 1 : windowsN;
}
