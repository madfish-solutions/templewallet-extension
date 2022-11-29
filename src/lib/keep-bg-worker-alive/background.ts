/*
  Inject this script into ServiceWorker.
*/

import browser from 'webextension-polyfill';

import { MANIFEST_VERSION, KEEP_BACKGROUND_WORKER_ALIVE } from './utils';

if (MANIFEST_VERSION === 3) {
  browser.runtime.onMessage.addListener((message: unknown) =>
    isKeepAliveMessage(message) ? Promise.resolve(true) : void 0
  );

  browser.runtime.onConnect.addListener(port => {
    if (port.name !== KEEP_BACKGROUND_WORKER_ALIVE) return;

    port.onMessage.addListener((message: unknown) => {
      if (isKeepAliveMessage(message)) port.postMessage(true);
    });
  });
}

const isKeepAliveMessage = (message: any) =>
  typeof message === 'object' && message !== null && message.type === KEEP_BACKGROUND_WORKER_ALIVE;
