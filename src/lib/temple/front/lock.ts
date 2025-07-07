// (!) Contains side-effects.

import browser from 'webextension-polyfill';

import { SHOULD_BACKUP_MNEMONIC_STORAGE_KEY } from 'lib/constants';
import { getLockUpTimeout } from 'lib/lock-up';
import { fetchFromStorage } from 'lib/storage';

const CLOSURE_STORAGE_KEY = 'last-page-closure-timestamp';

const isSinglePageOpened = () => getOpenedTemplePagesN() === 1;

export async function getShouldBeLockedOnStartup() {
  if (!isSinglePageOpened()) {
    return false;
  }

  const closureTimestamp = Number(localStorage.getItem(CLOSURE_STORAGE_KEY));
  const [shouldBackupMnemonic, autoLockTime] = await Promise.all([
    fetchFromStorage<boolean>(SHOULD_BACKUP_MNEMONIC_STORAGE_KEY).catch(() => false),
    getLockUpTimeout()
  ]);
  const shouldLockByTimeout = closureTimestamp && Date.now() - closureTimestamp >= autoLockTime;
  console.log('closureTimestamp', Date.now() - closureTimestamp)
  console.log('autoLockTime', autoLockTime)

  return shouldLockByTimeout || shouldBackupMnemonic;
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
