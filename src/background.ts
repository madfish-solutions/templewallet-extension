import { browser } from "webextension-polyfill-ts";

import { lock } from "lib/temple/back/actions";
import { start } from "lib/temple/back/main";

browser.runtime.onInstalled.addListener(({ reason }) => {
  switch (reason) {
    case "install":
      openFullPage();
      break;
  }
});

start();

if (process.env.TARGET_BROWSER === "safari") {
  browser.browserAction.onClicked.addListener(() => {
    openFullPage();
  });
}

function openFullPage() {
  browser.tabs.create({
    url: browser.runtime.getURL("fullpage.html"),
  });
}

const LOCK_TIME = 5 * 60_000;
let disconnectTimestamp = 0;
let connectionsCount = 0;

browser.runtime.onConnect.addListener((externalPort) => {
  connectionsCount++;
  if (
    connectionsCount === 1 &&
    Date.now() - disconnectTimestamp >= LOCK_TIME &&
    disconnectTimestamp !== 0
  ) {
    lock();
  }
  externalPort.onDisconnect.addListener(() => {
    connectionsCount--;
    if (connectionsCount === 0) {
      disconnectTimestamp = Date.now();
    }
  });
});
