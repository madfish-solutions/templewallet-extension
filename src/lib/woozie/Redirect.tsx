import * as React from "react";
import {
  To,
  createLocationState,
  createLocationUpdates
} from "lib/woozie/location";
import { HistoryAction, createUrl, changeState } from "lib/woozie/history";

interface RedirectProps {
  to: To;
  trigger?: HistoryAction.Push | HistoryAction.Replace;
  fallback?: React.ReactElement;
}

const Redirect: React.FC<RedirectProps> = ({
  to,
  trigger = HistoryAction.Replace,
  fallback = null
}) => {
  React.useEffect(() => {
    const lctn = createLocationState();
    const { pathname, search, hash, state } = createLocationUpdates(to, lctn);
    const url = createUrl(pathname, search, hash);

    // Defer until patched history listeners was added
    const timeout = setTimeout(() => {
      changeState(trigger, state, url);
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [to, trigger]);

  return fallback;
};

export default Redirect;
