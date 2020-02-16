import { browser } from "webextension-polyfill-ts";
import { ThanosRequest } from "lib/thanos/types";
import { processRequest } from "lib/thanos/back";

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
  if ("type" in msg) {
    return processRequest(msg as ThanosRequest);
  }
});

// browser.windows.create({
//   url: browser.runtime.getURL("confirm.html"),
//   type: "popup",
//   height: 680,
//   width: 420
// });
