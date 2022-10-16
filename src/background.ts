import { browser } from 'webextension-polyfill-ts';

import { lock } from 'lib/temple/back/actions';
import { start } from 'lib/temple/back/main';
import { getChromePredicate, getFFPredicate } from 'lib/temple/back/predicates';
import { isLockUpEnabled } from 'lib/ui/useLockUp';

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
let disconnectTimestamp = 0;
let connectionsCount = 0;

browser.runtime.onConnect.addListener(externalPort => {
  if (getChromePredicate(externalPort) || getFFPredicate(externalPort)) {
    connectionsCount++;
    const lockUpEnabled = isLockUpEnabled();
    if (
      connectionsCount === 1 &&
      Date.now() - disconnectTimestamp >= LOCK_TIME &&
      disconnectTimestamp !== 0 &&
      lockUpEnabled
    ) {
      lock();
    }
  }
  externalPort.onDisconnect.addListener(port => {
    if (getChromePredicate(port) || getFFPredicate(port)) {
      connectionsCount--;
    }
    if (connectionsCount === 0) {
      disconnectTimestamp = Date.now();
    }
  });
});
