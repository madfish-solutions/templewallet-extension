import "./main.css";

import * as React from "react";
import * as ReactDOM from "react-dom";
import Dexie from "dexie";
import { WindowType } from "app/env";
import App from "app/App";
import { getOperations } from "lib/tzkt";
import { getTokenTransfers } from "lib/better-call-dev";
// import * as Repo from "lib/temple/repo";
// import { syncOperations } from "lib/temple/activity";

ReactDOM.render(
  <App env={{ windowType: WindowType.FullPage }} />,
  document.getElementById("root")
);

Object.assign(window as any, {
  getOperations,
  getTokenTransfers,
  Dexie,
  // Repo,
  // syncOperations,
});
