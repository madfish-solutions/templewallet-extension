export enum HistoryAction {
  Pop = "popstate",
  Push = "pushstate",
  Replace = "replacestate"
}

export interface HistoryWithLastAction extends History {
  lastAction: HistoryAction;
}

patchMethod("pushState", HistoryAction.Push);
patchMethod("replaceState", HistoryAction.Replace);

export function navigate(
  action: HistoryAction.Push | HistoryAction.Replace,
  state: any,
  url: string
) {
  const title = "";

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
  return `${pathname}${search}${hash}`;
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
