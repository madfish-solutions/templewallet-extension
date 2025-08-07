// (!) Contains side-effects.

import browser from 'webextension-polyfill';

import { getLockUpTimeout } from 'lib/lock-up';

export const CLOSURE_STORAGE_KEY = 'last-page-closure-timestamp';

const isSinglePageOpened = () => getOpenedTemplePagesN() === 1;

export async function getShouldBeLockedOnStartup() {
  if (!isSinglePageOpened()) {
    return false;
  }

  const closureTimestamp = Number(localStorage.getItem(CLOSURE_STORAGE_KEY));
  const autoLockTime = await getLockUpTimeout();

  return closureTimestamp ? Date.now() - closureTimestamp >= autoLockTime : false;
}

document.addEventListener(
  'visibilitychange',
  () => {
    if (document.visibilityState === 'hidden' && isSinglePageOpened()) {
      localStorage.setItem(CLOSURE_STORAGE_KEY, Date.now().toString());
    }
  },
  true
);

function getOpenedTemplePagesN() {
  const windowsN = browser.extension.getViews().length;
  const bgWindow: Window | null = browser.extension.getBackgroundPage();
  return bgWindow ? windowsN - 1 : windowsN;
}
