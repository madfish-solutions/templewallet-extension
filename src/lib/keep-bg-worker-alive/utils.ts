import browser from 'webextension-polyfill';

const MANIFEST_VERSION = browser.runtime.getManifest().manifest_version;

export const BACKGROUND_IS_WORKER = MANIFEST_VERSION === 3;

export const KEEP_BACKGROUND_WORKER_ALIVE = 'KEEP_BACKGROUND_WORKER_ALIVE';

/**
 * Avoiding "Extension context invalidated" error logs.
 */
const contentScriptIsStillValid = () => Boolean(browser.runtime.id);

export const ping = (port?: browser.Runtime.Port) => {
  if (contentScriptIsStillValid() === false) return;

  const message = { type: KEEP_BACKGROUND_WORKER_ALIVE };

  browser.runtime.sendMessage(message);

  port?.postMessage(message);
};
