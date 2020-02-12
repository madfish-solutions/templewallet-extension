import * as React from "react";
import * as Woozie from "lib/woozie";
import { useThanosFrontContext } from "lib/thanos/front";
import { WindowType, useAppEnvContext, OpenInFullPage } from "app/env";
import Unlock from "app/pages/Unlock";
import Welcome from "app/pages/Welcome";
import Explore from "app/pages/Explore";

interface RouteContext {
  appEnv: ReturnType<typeof useAppEnvContext>;
  thanosFront: ReturnType<typeof useThanosFrontContext>;
}

const ROUTE_MAP = Woozie.Router.createMap<RouteContext>([
  [
    "*",
    (_p, { thanosFront }) =>
      thanosFront.unlocked ? Woozie.Router.SKIP : <Unlock />
  ],
  [
    "*",
    (_p, { appEnv, thanosFront }) =>
      thanosFront.authorized || appEnv.windowType === WindowType.FullPage ? (
        Woozie.Router.SKIP
      ) : (
        <OpenInFullPage />
      )
  ],
  [
    "/",
    (_p, { thanosFront }) => (
      <Woozie.Redirect to={thanosFront.authorized ? "/explore" : "/welcome"} />
    )
  ],
  [
    "/welcome",
    (_p, { thanosFront }) =>
      !thanosFront.authorized ? <Welcome /> : Woozie.Router.SKIP
  ],
  [
    "/explore",
    (_p, { thanosFront }) =>
      thanosFront.authorized ? <Explore /> : Woozie.Router.SKIP
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
