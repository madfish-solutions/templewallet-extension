// import { configure, observable, computed, action } from "mobx";
import { browser } from "webextension-polyfill-ts";

// interface Storage {
//   accounts: any[]
// }

// // Don't allow state modifications outside actions.
// configure({ enforceActions: "observed" });

// (async () => {
//   try {
//     const storage = await getStorage();
//     const thanosWallet = new ThanosWallet(storage);

//   } catch (err) {
//     if (process.env.NODE_ENV === "development") {
//       console.error(err);
//     }
//   }
// })();

// async function getStorage() {
//   const val = await browser.storage.local.get();
//   return Object.keys(val).length !== 0
//     ? val as Storage
//     : null;
// }

// class ThanosWallet {
//   storage: Storage | null;

//   constructor(storage: Storage | null) {
//     this.storage = storage;
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
