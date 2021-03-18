import "./main.css";

import React from "react";

import * as ReactDOM from "react-dom";

import App from "app/App";
import { WindowType } from "app/env";

ReactDOM.render(
  <App env={{ windowType: WindowType.FullPage, confirmWindow: true }} />,
  document.getElementById("root")
);
