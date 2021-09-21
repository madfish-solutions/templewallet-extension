import { FC, ReactElement, useLayoutEffect } from "react";

import { HistoryAction, createUrl, changeState } from "lib/woozie/history";
import {
  To,
  createLocationState,
  createLocationUpdates,
} from "lib/woozie/location";

type RedirectProps = {
  to: To;
  push?: boolean;
  fallback?: ReactElement;
};

const Redirect: FC<RedirectProps> = ({ to, push = false, fallback = null }) => {
  useLayoutEffect(() => {
    const lctn = createLocationState();
    const { pathname, search, hash, state } = createLocationUpdates(to, lctn);
    const url = createUrl(pathname, search, hash);
    changeState(push ? HistoryAction.Push : HistoryAction.Replace, state, url);
  }, [to, push]);

  return fallback;
};

export default Redirect;
