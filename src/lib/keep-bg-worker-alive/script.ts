/*
  Inject this script into Content Script of every possible opened tab.
*/

import browser from 'webextension-polyfill';

import { MANIFEST_VERSION, KEEP_BACKGROUND_WORKER_ALIVE, ping } from './utils';

if (MANIFEST_VERSION === 3) {
  let port: browser.Runtime.Port;
  (function connect() {
    port = browser.runtime.connect({ name: KEEP_BACKGROUND_WORKER_ALIVE });
    port.onDisconnect.addListener(connect);
  })();

  ping(port);

  setInterval(() => ping(port), 1_000);
}
