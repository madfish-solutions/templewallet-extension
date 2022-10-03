import { FC, ReactElement, useEffect } from 'react';

import { HistoryAction, createUrl, changeState } from './history';
import { To, createLocationState, createLocationUpdates } from './location';

type RedirectProps = {
  to: To;
  push?: boolean;
  fallback?: ReactElement;
};

export const Redirect: FC<RedirectProps> = ({ to, push = false, fallback = null }) => {
  useEffect(() => {
    const lctn = createLocationState();
    const { pathname, search, hash, state } = createLocationUpdates(to, lctn);
    const url = createUrl(pathname, search, hash);
    changeState(push ? HistoryAction.Push : HistoryAction.Replace, state, url);
  }, [to, push]);

  return fallback;
};
