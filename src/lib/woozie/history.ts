import * as React from "react";
import useForceUpdate from "use-force-update";
import { USE_LOCATION_HASH_AS_URL } from "lib/woozie/config";

export enum HistoryAction {
  Pop = "popstate",
  Push = "pushstate",
  Replace = "replacestate"
}

export interface HistoryWithLastAction extends History {
  lastAction: HistoryAction;
}

export type HistoryListener = () => void;

const listeners = new Set<HistoryListener>();

export function listen(listener: HistoryListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useHistory() {
  const forceUpdate = useForceUpdate();
  React.useLayoutEffect(() => listen(forceUpdate), [forceUpdate]);
}

export function changeState(
  action: HistoryAction.Push | HistoryAction.Replace,
  state: any,
  url: string
) {
  const title = ""; // Deprecated stuff

  if (USE_LOCATION_HASH_AS_URL) {
    const { pathname, search } = window.location;
    url = createUrl(pathname, search, url);
  }

  switch (action) {
    case HistoryAction.Push:
      window.history.pushState(state, title, url);
      break;

    case HistoryAction.Replace:
      window.history.replaceState(state, title, url);
      break;
  }
}

export function go(delta: number) {
  window.history.go(delta);
}

export function goBack() {
  go(-1);
}

export function goForward() {
  go(1);
}

export function createUrl(
  pathname: string = "/",
  search: string = "",
  hash: string = ""
): string {
  if (search && !search.startsWith("?")) {
    search = `?${search}`;
  }
  if (hash && !hash.startsWith("#")) {
    hash = `#${hash}`;
  }
  return `${pathname}${search}${hash}`;
}

patchMethod("pushState", HistoryAction.Push);
patchMethod("replaceState", HistoryAction.Replace);

window.addEventListener(HistoryAction.Pop, handlePopstate);
window.addEventListener(HistoryAction.Push, handlePushstate);
window.addEventListener(HistoryAction.Replace, handleReplacestate);

function handlePopstate() {
  patchLastAction(HistoryAction.Pop);
  notifyListeners();
}
function handlePushstate() {
  patchLastAction(HistoryAction.Push);
  notifyListeners();
}
function handleReplacestate() {
  patchLastAction(HistoryAction.Replace);
  notifyListeners();
}

function patchLastAction(action: HistoryAction) {
  (window.history as HistoryWithLastAction).lastAction = action;
}

function notifyListeners() {
  listeners.forEach(listener => listener());
}

function patchMethod(method: string, eventType: HistoryAction) {
  const history = window.history as any;
  const original = history[method];

  history[method] = function(state: any) {
    const result = original.apply(this, arguments);

    const event = new CustomEvent(eventType);
    (event as any).state = state;
    window.dispatchEvent(event);

    return result;
  };
}
