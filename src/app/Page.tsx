import * as React from "react";
import * as Woozie from "lib/woozie";
import { useThanosFrontContext } from "lib/thanos/front";
import { WindowType, useAppEnvContext, RedirectToFullPage } from "app/env";
import Unlock from "app/pages/Unlock";
import ImportAccount from "app/pages/ImportAccount";
import Explore from "app/pages/Explore";

interface RouteContext {
  appEnv: ReturnType<typeof useAppEnvContext>;
  thanosFront: ReturnType<typeof useThanosFrontContext>;
}

const ROUTE_MAP = Woozie.Router.createMap<RouteContext>([
  [
    "*",
    (_p, { appEnv }) =>
      appEnv.windowType === WindowType.FullPage ? (
        Woozie.Router.SKIP
      ) : (
        <RedirectToFullPage />
      )
  ],
  [
    "*",
    (_p, { thanosFront }) =>
      thanosFront.unlocked ? Woozie.Router.SKIP : <Unlock />
  ],
  [
    "/",
    (_p, { thanosFront }) => (
      <Woozie.Redirect to={thanosFront.authorized ? "/explore" : "/signin"} />
    )
  ],
  [
    "/signin",
    (_p, { thanosFront }) =>
      thanosFront.authorized ? <Woozie.Redirect to="/" /> : <ImportAccount />
  ],
  [
    "/explore",
    (_p, { thanosFront }) =>
      thanosFront.authorized ? <Explore /> : <Woozie.Redirect to="/" />
  ],
  ["*", () => <Woozie.Redirect to="/" />]
]);

const Page: React.FC = () => {
  const { trigger, pathname } = Woozie.useLocationContext();

  // Scroll to top after new location pushed.
  React.useLayoutEffect(() => {
    if (trigger === Woozie.HistoryAction.Push) {
      window.scrollTo(0, 0);
    }
  }, [trigger, pathname]);

  const appEnv = useAppEnvContext();
  const thanosFront = useThanosFrontContext();

  const ctx = React.useMemo<RouteContext>(() => ({ appEnv, thanosFront }), [
    appEnv,
    thanosFront
  ]);

  return Woozie.Router.resolve(ROUTE_MAP, pathname, ctx);
};

export default Page;
