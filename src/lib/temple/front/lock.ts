// (!) Contains side-effects.

import browser from 'webextension-polyfill';

import { NEVER_AUTOLOCK_VALUE } from 'lib/constants';
import { getLockUpTimeout } from 'lib/lock-up';
import { TempleMessageType } from 'lib/temple/types';
import { makeIntercomRequest } from 'temple/front/intercom-client';

export const CLOSURE_STORAGE_KEY = 'last-page-closure-timestamp';

const isSinglePageOpened = () => getOpenedTemplePagesN() === 1;

export async function getShouldBeLockedOnStartup() {
  if (!isSinglePageOpened()) {
    return false;
  }

  const closureTimestamp = Number(localStorage.getItem(CLOSURE_STORAGE_KEY));
  const autoLockTime = await getLockUpTimeout();

  return closureTimestamp && Date.now() - closureTimestamp >= autoLockTime;
}

let lockTimeout: ReturnType<typeof setTimeout> | undefined;

document.addEventListener(
  'visibilitychange',
  async () => {
    if (document.visibilityState === 'hidden' && isSinglePageOpened()) {
      const closureTime = Date.now();
      localStorage.setItem(CLOSURE_STORAGE_KEY, closureTime.toString());

      const autoLockTime = await getLockUpTimeout();

      if (autoLockTime !== NEVER_AUTOLOCK_VALUE) {
        lockTimeout = setTimeout(() => {
          void makeIntercomRequest({ type: TempleMessageType.LockRequest });
        }, autoLockTime);
      }
    }

    if (document.visibilityState === 'visible') {
      if (lockTimeout) {
        clearTimeout(lockTimeout);
        lockTimeout = undefined;
      }
    }
  },
  true
);

function getOpenedTemplePagesN() {
  const windowsN = browser.extension.getViews().length;
  const bgWindow: Window | null = browser.extension.getBackgroundPage();
  return bgWindow ? windowsN - 1 : windowsN;
}
