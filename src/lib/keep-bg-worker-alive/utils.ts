import browser from 'webextension-polyfill';

export const MANIFEST_VERSION = browser.runtime.getManifest().manifest_version;

export const KEEP_BACKGROUND_WORKER_ALIVE = 'KEEP_BACKGROUND_WORKER_ALIVE';

export const ping = (port?: browser.Runtime.Port) => {
  const message = { type: KEEP_BACKGROUND_WORKER_ALIVE };

  browser.runtime.sendMessage(message);

  port?.postMessage(message);
};
