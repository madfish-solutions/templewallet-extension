import * as Router from "lib/woozie/router";
import { HistoryAction, createUrl, changeState } from "lib/woozie/history";
import {
  To,
  createLocationState,
  createLocationUpdates,
} from "lib/woozie/location";

export * from "lib/woozie/config";
export * from "lib/woozie/history";
export * from "lib/woozie/location";
export { default as Provider } from "lib/woozie/Provider";
export { default as Link } from "lib/woozie/Link";
export { default as Redirect } from "lib/woozie/Redirect";
export { Router };

export function navigate(
  to: To,
  action?: HistoryAction.Push | HistoryAction.Replace
) {
  const lctn = createLocationState();
  const lctnUpdates = createLocationUpdates(to, lctn);

  const { pathname, search, hash, state } = lctnUpdates;
  const url = createUrl(pathname, search, hash);

  if (!action) {
    action =
      url === createUrl(lctn.pathname, lctn.search, lctn.hash)
        ? HistoryAction.Replace
        : HistoryAction.Push;
  }

  changeState(action, state, url);
}
