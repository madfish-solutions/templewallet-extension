import browser from 'webextension-polyfill';

import { getIsLockUpEnabled } from 'lib/lock-up';
import { fetchFromStorage, putToStorage } from 'lib/storage';
import { lock } from 'lib/temple/back/actions';
import { isExtensionPageByPort, getOpenedPagesN } from 'lib/temple/back/helpers';
import { start } from 'lib/temple/back/main';

browser.runtime.onInstalled.addListener(({ reason }) => (reason === 'install' ? openFullPage() : null));

start();

if (process.env.TARGET_BROWSER === 'safari') {
  browser.browserAction.onClicked.addListener(() => {
    openFullPage();
  });
}

function openFullPage() {
  browser.tabs.create({
    url: browser.runtime.getURL('fullpage.html')
  });
}

const LOCK_TIME = 5 * 60_000;
const LAST_PAGE_CLOSURE_TIME_STORAGE_KEY = '@(BG):last-page-closure-timestamp';

browser.runtime.onConnect.addListener(externalPort => {
  if (isExtensionPageByPort(externalPort) && getOpenedPagesN() === 1) {
    lockUpIfNeeded();
  }

  externalPort.onDisconnect.addListener(port => {
    if (isExtensionPageByPort(port) && getOpenedPagesN() === 0) {
      putToStorage(LAST_PAGE_CLOSURE_TIME_STORAGE_KEY, Date.now());
    }
  });
});

async function lockUpIfNeeded() {
  const lockUpEnabled = await getIsLockUpEnabled();
  if (lockUpEnabled === false) return;
  const lastPageClosureTimestamp = await fetchFromStorage<number>(LAST_PAGE_CLOSURE_TIME_STORAGE_KEY);
  if (lastPageClosureTimestamp && Date.now() - lastPageClosureTimestamp >= LOCK_TIME) lock();
}
