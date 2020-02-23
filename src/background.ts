import { browser } from "webextension-polyfill-ts";
import { Queue } from "queue-ts";
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

const queue = new Queue(1);

browser.runtime.onMessage.addListener(msg => {
  if ("type" in msg) {
    return new Promise((res, rej) => {
      queue.add(() =>
        processRequest(msg as ThanosRequest)
          .then(res)
          .catch(rej)
      );
    });
  }
});

// browser.windows.create({
//   url: browser.runtime.getURL("confirm.html"),
//   type: "popup",
//   height: 680,
//   width: 420
// });
