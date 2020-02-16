import "./main.css";

import * as React from "react";
import * as ReactDOM from "react-dom";
import { WindowType } from "app/env";
import App from "app/App";

ReactDOM.render(
  <App env={{ windowType: WindowType.Popup }} />,
  document.getElementById("root")
);

// (async () => {
//   const tabs = await browser.tabs.query({
//     active: true,
//     lastFocusedWindow: true
//   });

//   const url = tabs.length && tabs[0].url;

//   const response = await browser.runtime.sendMessage({
//     msg: "hello",
//     url
//   });

//   console.info(response);
// })();
