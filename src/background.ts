import { browser } from 'webextension-polyfill-ts';

import 'lib/runtime-patch';
import 'lib/xhr-polyfill';

import { getLockUpEnabled } from 'lib/lock-up';
import { lock } from 'lib/temple/back/actions';
import { start } from 'lib/temple/back/main';
import { getChromePredicate, getFFPredicate } from 'lib/temple/back/predicates';

browser.runtime.onInstalled.addListener(({ reason }) => (reason === 'install' ? openFullPage() : null));

start();

if (process.env.TARGET_BROWSER === 'safari') {
  browser.action.onClicked.addListener(() => {
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
    checkOnLockUp();
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

async function checkOnLockUp() {
  const lockUpEnabled = await getLockUpEnabled();

  if (
    connectionsCount === 1 &&
    Date.now() - disconnectTimestamp >= LOCK_TIME &&
    disconnectTimestamp !== 0 &&
    lockUpEnabled
  ) {
    lock();
  }
}
