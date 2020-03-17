import { browser } from "webextension-polyfill-ts";
import { IntercomServer } from "lib/intercom/server";
import { start } from "lib/thanos/back";

browser.runtime.onInstalled.addListener(({ reason }) => {
  switch (reason) {
    case "install":
      browser.tabs.create({
        url: browser.runtime.getURL("fullpage.html")
      });
      break;
  }
});

start(new IntercomServer());

// browser.windows.create({
//   url: browser.runtime.getURL("confirm.html"),
//   type: "popup",
//   height: 680,
//   width: 420
// });
