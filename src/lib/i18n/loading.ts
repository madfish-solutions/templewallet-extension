import { browser } from "webextension-polyfill-ts";

import { init } from "./core";
import { saveLocale } from "./saving";

export const REFRESH_MSGTYPE = "TEMPLE_I18N_REFRESH";

const initPromise = init();

browser.runtime.onMessage.addListener((msg) => {
  if (msg?.type === REFRESH_MSGTYPE) {
    refresh();
  }
});

export function onInited(callback: () => void) {
  initPromise.then(callback);
}

export function updateLocale(locale: string) {
  saveLocale(locale);
  notifyOthers();
  refresh();
}

function notifyOthers() {
  browser.runtime.sendMessage({ type: REFRESH_MSGTYPE });
}

async function refresh() {
  if (await isBackgroundScript()) {
    init();
  } else {
    window.location.reload();
  }
}

async function isBackgroundScript() {
  let backgroundWindow;
  try {
    backgroundWindow = await browser.runtime.getBackgroundPage();
  } catch {}
  return window === backgroundWindow;
}
