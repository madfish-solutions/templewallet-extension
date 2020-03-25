import * as React from "react";
import {
  To,
  createLocationState,
  createLocationUpdates
} from "lib/woozie/location";
import { HistoryAction, createUrl, changeState } from "lib/woozie/history";

type RedirectProps = {
  to: To;
  push?: boolean;
  fallback?: React.ReactElement;
};

const Redirect: React.FC<RedirectProps> = ({
  to,
  push = false,
  fallback = null
}) => {
  React.useLayoutEffect(() => {
    const lctn = createLocationState();
    const { pathname, search, hash, state } = createLocationUpdates(to, lctn);
    const url = createUrl(pathname, search, hash);

    // Defer until patched history listeners was added
    const timeout = setTimeout(() => {
      changeState(
        push ? HistoryAction.Push : HistoryAction.Replace,
        state,
        url
      );
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [to, push]);

  return fallback;
};

export default Redirect;
