import { HistoryAction, createUrl, changeState } from './history';
import { To, createLocationState, createLocationUpdates } from './location';

export { resetHistoryPosition, goBack, createUrl, HistoryAction } from './history';
export { useLocation } from './location';
export type { To } from './location';

export { default as Provider } from './Provider';
export { default as Link } from './Link';
export { default as Redirect } from './Redirect';

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
