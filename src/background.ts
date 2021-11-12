import { browser } from "webextension-polyfill-ts";

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

var disconnectTimestamp = 0

browser.runtime.onConnect.addListener(function (externalPort) {
  console.log('onConnect')
  disconnectTimestamp = 0;
  externalPort.onDisconnect.addListener(function () {
    disconnectTimestamp = Date.now();
    console.log("onDisconnect");
  });
}
);