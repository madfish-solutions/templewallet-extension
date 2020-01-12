import { browser } from "webextension-polyfill-ts";

browser.runtime.onInstalled.addListener(({ reason }) => {
  switch (reason) {
    case "install":
      browser.tabs.create({
        url: browser.runtime.getURL("welcome.html")
      });
      break;
  }
});

browser.runtime.onMessage.addListener((msg, _sender) => {
  // Do something with the message!
  alert(msg.url);

  // And respond back to the sender.
  return Promise.resolve("got your message, thanks!");
});
