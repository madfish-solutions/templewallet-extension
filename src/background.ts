// import { observable, computed } from "mobx";
import { browser } from "webextension-polyfill-ts";

// class OrderLine {
//   @observable
//   price = 0;

//   @observable
//   amount = 1;

//   @computed
//   get total() {
//     return this.price * this.amount;
//   }
// }

browser.runtime.onInstalled.addListener(({ reason }) => {
  switch (reason) {
    case "install":
      browser.tabs.create({
        url: browser.runtime.getURL("welcome.html")
      });
      break;
  }
});

// browser.runtime.onMessage.addListener(async (msg, sender) => {
//   browser.windows.create({
//     url: browser.runtime.getURL("action.html"),
//     type: "popup",
//     height: 680,
//     width: 420
//   });

//   return "PONG";
// });

// browser.runtime.onMessage.addListener((msg, _sender) => {
//   // Do something with the message!
//   alert(msg.url);

//   // And respond back to the sender.
//   return Promise.resolve("got your message, thanks!");
// });
