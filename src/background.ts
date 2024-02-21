import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging/sw';
import browser from 'webextension-polyfill';

import 'lib/keep-bg-worker-alive/background';

import { EnvVars } from 'lib/env';
import { updateRulesStorage } from 'lib/slise/update-rules-storage';
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

globalThis.addEventListener('notificationclick', event => {
  // @ts-ignore
  event.notification.close();
  // @ts-ignore
  event.waitUntil(clients.openWindow(`${event.target.registration.scope}fullpage.html`));
});

const firebase = initializeApp(JSON.parse(EnvVars.TEMPLE_FIREBASE_CONFIG));
getMessaging(firebase);

updateRulesStorage();
