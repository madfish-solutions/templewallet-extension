import type Browser from 'webextension-polyfill';

export const browser = (() => {
  // @ts-expect-error
  const browser: typeof Browser | undefined = globalThis.chrome || globalThis.browser;
  if (browser == null) throw new Error('Not browser extension');
  return browser;
})();

const MANIFEST_VERSION = browser.runtime.getManifest().manifest_version;

export const BACKGROUND_IS_WORKER = MANIFEST_VERSION === 3;

export const KEEP_BACKGROUND_WORKER_ALIVE = 'KEEP_BACKGROUND_WORKER_ALIVE';

/**
 * Avoiding "Extension context invalidated" error logs.
 */
const contentScriptIsStillValid = () => Boolean(browser.runtime.id);

export const ping = (port?: Browser.Runtime.Port) => {
  if (contentScriptIsStillValid() === false) return;

  const message = { type: KEEP_BACKGROUND_WORKER_ALIVE };

  browser.runtime.sendMessage(message);

  port?.postMessage(message);
};
