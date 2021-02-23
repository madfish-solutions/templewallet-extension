import { browser } from "webextension-polyfill-ts";
import { start } from "lib/temple/back/main";

browser.runtime.onInstalled.addListener(({ reason }) => {
  switch (reason) {
    case "install":
      browser.tabs.create({
        url: browser.runtime.getURL("fullpage.html"),
      });
      break;
  }
});

start();
