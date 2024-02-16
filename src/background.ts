import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging/sw';
import browser from 'webextension-polyfill';

import 'lib/keep-bg-worker-alive/background';
import {
  getStoredAppUpdateDetails,
  putStoredAppUpdateDetails,
  removeStoredAppUpdateDetails
} from 'app/storage/app-update';
import { updateRulesStorage } from 'lib/ads/update-rules-storage';
import { EnvVars } from 'lib/env';
import { start } from 'lib/temple/back/main';

browser.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    openFullPage();
    return;
  }

  if (reason === 'update')
    getStoredAppUpdateDetails().then(details => {
      if (details) {
        removeStoredAppUpdateDetails();

        if (details.triggeredManually) openFullPage();
      }
    });
});

browser.runtime.onUpdateAvailable.addListener(newManifest => {
  putStoredAppUpdateDetails(newManifest);
});

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
  // @ts-expect-error
  event.notification.close();
  // @ts-expect-error
  event.waitUntil(clients.openWindow(`${event.target.registration.scope}fullpage.html`));
});

const firebase = initializeApp(JSON.parse(EnvVars.TEMPLE_FIREBASE_CONFIG));
getMessaging(firebase);

updateRulesStorage();
