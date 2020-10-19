import { browser } from "webextension-polyfill-ts";
import { init } from "./core";
import { saveLocale } from "./saving";

export const REFRESH_MSGTYPE = "THANOS_I18N_REFRESH";

const initPromise = init();

browser.runtime.onMessage.addListener(async (msg) => {
  if (msg?.type === REFRESH_MSGTYPE) {
    if (await isBackgroundScript()) {
      init();
    } else {
      window.location.reload();
    }
  }
});

export function onInited(callback: () => void) {
  initPromise.then(callback);
}

export function updateLocale(locale: string) {
  saveLocale(locale);
  refresh();
}

function refresh() {
  browser.runtime.sendMessage({ type: REFRESH_MSGTYPE });
}

async function isBackgroundScript() {
  let backgroundWindow;
  try {
    backgroundWindow = await browser.runtime.getBackgroundPage();
  } catch {}
  return window === backgroundWindow;
}
