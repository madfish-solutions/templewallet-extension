import * as React from "react";
import * as Woozie from "lib/woozie";
import { useThanosFrontContext } from "lib/thanos/front";
import { WindowType, useAppEnvContext, OpenInFullPage } from "app/env";
import Unlock from "app/pages/Unlock";
import Welcome from "app/pages/Welcome";
import ImportWallet from "app/pages/ImportWallet";
import CreateWallet from "app/pages/CreateWallet";
import Explore from "app/pages/Explore";

interface RouteContext {
  appEnv: ReturnType<typeof useAppEnvContext>;
  thanosFront: ReturnType<typeof useThanosFrontContext>;
}

const ROUTE_MAP = Woozie.Router.createMap<RouteContext>([
  [
    "/import-wallet",
    (_p, { appEnv, thanosFront }) => {
      switch (true) {
        case thanosFront.ready:
          return Woozie.Router.SKIP;

        case appEnv.windowType !== WindowType.FullPage:
          return <OpenInFullPage />;

        default:
          return <ImportWallet />;
      }
    }
  ],
  [
    "*",
    (_p, { thanosFront }) =>
      thanosFront.locked ? <Unlock /> : Woozie.Router.SKIP
  ],
  [
    "*",
    (_p, { appEnv, thanosFront }) =>
      thanosFront.ready || appEnv.windowType === WindowType.FullPage ? (
        Woozie.Router.SKIP
      ) : (
        <OpenInFullPage />
      )
  ],
  [
    "/",
    (_p, { thanosFront }) => (
      <Woozie.Redirect to={thanosFront.ready ? "/explore" : "/welcome"} />
    )
  ],
  [
    "/welcome",
    (_p, { thanosFront }) =>
      !thanosFront.ready ? <Welcome /> : Woozie.Router.SKIP
  ],
  [
    "/create-wallet",
    (_p, { thanosFront }) =>
      !thanosFront.ready ? <CreateWallet /> : Woozie.Router.SKIP
  ],
  [
    "/explore",
    (_p, { thanosFront }) =>
      thanosFront.ready ? <Explore /> : Woozie.Router.SKIP
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
