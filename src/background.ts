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

browser.runtime.onConnect.addListener(function (externalPort) {
  console.log('onConnect')
  externalPort.onDisconnect.addListener(function () {
    var ignoreError = browser.runtime.lastError;
    console.log("onDisconnect");
  });
}
);