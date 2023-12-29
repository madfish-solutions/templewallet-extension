import { HistoryAction, createUrl, changeState } from './history';
import { To, createLocationState, createLocationUpdates } from './location';

export { resetHistoryPosition, goBack, createUrl, HistoryAction } from './history';
export { useLocation } from './location';
export type { To } from './location';

export type { ResolveResult } from './router';
export { SKIP, createMap, resolve } from './router';

export { Provider } from './Provider';
export { Link } from './Link';
export { Redirect } from './Redirect';

export function navigate(to: To, action?: HistoryAction.Push | HistoryAction.Replace) {
  const lctn = createLocationState();
  const lctnUpdates = createLocationUpdates(to, lctn);

  const { pathname, search, hash, state } = lctnUpdates;
  const url = createUrl(pathname, search, hash);

  if (!action) {
    action = url === createUrl(lctn.pathname, lctn.search, lctn.hash) ? HistoryAction.Replace : HistoryAction.Push;
  }

  changeState(action, state, url);
}

export function setNavigateSearchParams(
  searchParams: StringRecord,
  action: HistoryAction.Replace | HistoryAction.Push = HistoryAction.Replace
) {
  const lctn = createLocationState();

  const search = new URLSearchParams(lctn.search);
  for (const [key, val] of Object.entries(searchParams)) {
    search.set(key, val);
  }

  const url = createUrl(lctn.pathname, search.toString(), lctn.hash);

  changeState(action, lctn.state, url);
}
