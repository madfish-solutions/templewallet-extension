import "./main.css";

import * as React from "react";
import * as ReactDOM from "react-dom";
import { browser } from "webextension-polyfill-ts";
import { isPopupModeEnabled } from "lib/popup-mode";
import { WindowType, openInFullPage } from "app/env";
import App from "app/App";

ReactDOM.render(
  <App env={{ windowType: WindowType.Popup }} />,
  document.getElementById("root")
);

const popups = browser.extension.getViews({ type: "popup" });
if (!popups.includes(window) || !isPopupModeEnabled()) {
  openInFullPage();
  window.close();
}
