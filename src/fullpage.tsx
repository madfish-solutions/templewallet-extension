import "./main.css";

import * as React from "react";
import * as ReactDOM from "react-dom";
import { WindowType } from "app/env";
import App from "app/App";

ReactDOM.render(
  <App env={{ windowType: WindowType.FullPage }} />,
  document.getElementById("root")
);
