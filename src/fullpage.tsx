import "./main.css";

import React from "react";

import * as ReactDOM from "react-dom";

import App from "app/App";
import { WindowType } from "app/env";
import * as Repo from "lib/temple/repo";

ReactDOM.render(
  <App env={{ windowType: WindowType.FullPage }} />,
  document.getElementById("root")
);

(window as any).Repo = Repo;
