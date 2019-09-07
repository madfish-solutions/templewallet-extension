import { createLocationState, ModifyLocation } from "./location/state";
import { HistoryAction, navigate, createUrl } from "./location/history";
import useHistory from "./location/useHistory";
import useLocation from "./location/useLocation";
import useLocationContext from "./location/useLocationContext";
import Link from "./location/Link";
import LinkAnchor from "./location/Link/Anchor";
import Redirect from "./location/Redirect";

export function push(modifyLocation: ModifyLocation) {
  change(HistoryAction.Push, modifyLocation);
}

export function replace(modifyLocation: ModifyLocation) {
  change(HistoryAction.Replace, modifyLocation);
}

export function change(
  action: HistoryAction.Push | HistoryAction.Replace,
  modifyLocation: ModifyLocation
) {
  const lctn = createLocationState();
  const lctnUpdates = modifyLocation(lctn);

  const { pathname, search, hash, state } = lctnUpdates;
  const url = createUrl(pathname, search, hash);

  navigate(action, state, url);
}

export {
  createLocationState,
  HistoryAction,
  useHistory,
  useLocation,
  useLocationContext,
  Link,
  LinkAnchor,
  Redirect
};
