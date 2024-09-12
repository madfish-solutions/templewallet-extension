import { initializeApp } from '@firebase/app';
import { getMessaging } from '@firebase/messaging/sw';
import browser from 'webextension-polyfill';

import 'lib/keep-bg-worker-alive/background';
import { putStoredAppInstallIdentity } from 'app/storage/app-install-id';
import {
  getStoredAppUpdateDetails,
  putStoredAppUpdateDetails,
  removeStoredAppUpdateDetails
} from 'app/storage/app-update';
import { updateRulesStorage } from 'lib/ads/update-rules-storage';
import {
  ADS_VIEWER_ADDRESS_STORAGE_KEY,
  MAX_OPEN_EXTENSION_TAB_ACTIONS_COUNTER,
  OPEN_EXTENSION_TAB_ACTIONS_COUNTER_STORAGE_KEY
} from 'lib/constants';
import { EnvVars, IS_MISES_BROWSER } from 'lib/env';
import { fetchFromStorage, putToStorage } from 'lib/storage';
import { start } from 'lib/temple/back/main';
import { generateKeyPair } from 'lib/utils/ecdsa';

import PackageJSON from '../package.json';

browser.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    prepareAppIdentity().finally(openFullPage);

    putToStorage(OPEN_EXTENSION_TAB_ACTIONS_COUNTER_STORAGE_KEY, MAX_OPEN_EXTENSION_TAB_ACTIONS_COUNTER).catch(error =>
      console.error(error)
    );
  }

  if (reason === 'update') {
    getStoredAppUpdateDetails()
      .then(details => {
        let fullPageIsOpened = false;
        if (details) {
          removeStoredAppUpdateDetails();

          if (details.triggeredManually) {
            openFullPage();
            fullPageIsOpened = true;
          }
        }

        return Promise.all([
          fetchFromStorage<string>(ADS_VIEWER_ADDRESS_STORAGE_KEY),
          fetchFromStorage<number>(OPEN_EXTENSION_TAB_ACTIONS_COUNTER_STORAGE_KEY),
          Promise.resolve(fullPageIsOpened)
        ]);
      })
      .then(([accountPkh, counter, fullPageIsOpened]) => {
        if (fullPageIsOpened) {
          return putToStorage(OPEN_EXTENSION_TAB_ACTIONS_COUNTER_STORAGE_KEY, MAX_OPEN_EXTENSION_TAB_ACTIONS_COUNTER);
        }

        if ((counter ?? 0) >= MAX_OPEN_EXTENSION_TAB_ACTIONS_COUNTER || !accountPkh || IS_MISES_BROWSER) {
          return;
        }

        openFullPage();

        return putToStorage(OPEN_EXTENSION_TAB_ACTIONS_COUNTER_STORAGE_KEY, MAX_OPEN_EXTENSION_TAB_ACTIONS_COUNTER);
      })
      .catch(error => console.error(error));
  }
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
  event.waitUntil(clients.openWindow(`${event.target.registration.scope}fullpage.html#/notifications`));
});

const firebase = initializeApp(JSON.parse(EnvVars.TEMPLE_FIREBASE_CONFIG));
getMessaging(firebase);

updateRulesStorage();

async function prepareAppIdentity() {
  const { privateKey, publicKey, publicKeyHash } = await generateKeyPair();

  const ts = new Date().toISOString();

  await putStoredAppInstallIdentity({
    version: PackageJSON.version,
    privateKey,
    publicKey,
    publicKeyHash: publicKeyHash.slice(0, 32),
    ts
  });
}
