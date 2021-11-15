import { browser } from "webextension-polyfill-ts";

import { start, lockWallet } from "lib/temple/back/main";
// import { start } from "lib/temple/back/main";

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

const LOCK_TIME = 2 * 60_000
let disconnectTimestamp = 0

browser.runtime.onConnect.addListener(function (externalPort) {
  if (Date.now() - disconnectTimestamp >= LOCK_TIME) {
    lockWallet()
  }
  disconnectTimestamp = 0;
  externalPort.onDisconnect.addListener(function () {
    disconnectTimestamp = Date.now();
  });
}
);