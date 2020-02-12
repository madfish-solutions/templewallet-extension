import { browser } from "webextension-polyfill-ts";
import { ThanosMessageType } from "lib/thanos/types";
import { getFrontState, importAccount, unlock } from "lib/thanos/back";

browser.runtime.onInstalled.addListener(({ reason }) => {
  switch (reason) {
    case "install":
      browser.tabs.create({
        url: browser.runtime.getURL("fullpage.html")
      });
      break;
  }
});

browser.runtime.onMessage.addListener(async msg => {
  switch (msg?.type) {
    case ThanosMessageType.GET_STATE:
      return getFrontState();

    case ThanosMessageType.IMPORT_ACCOUNT:
      return importAccount(msg?.privateKey);

    case ThanosMessageType.UNLOCK:
      return unlock(msg?.passphrase);
  }
});

// browser.windows.create({
//   url: browser.runtime.getURL("confirm.html"),
//   type: "popup",
//   height: 680,
//   width: 420
// });
