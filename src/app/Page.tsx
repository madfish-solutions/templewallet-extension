import * as React from "react";
import * as Woozie from "lib/woozie";
import { useThanosFront } from "lib/thanos/front";
import { WindowType, useAppEnv, OpenInFullPage } from "app/env";
import Unlock from "app/pages/Unlock";
import Welcome from "app/pages/Welcome";
import ImportWallet from "app/pages/ImportWallet";
import CreateWallet from "app/pages/CreateWallet";
import Explore from "app/pages/Explore";
import Settings from "app/pages/Settings";

interface RouteContext {
  appEnv: ReturnType<typeof useAppEnv>;
  thanosFront: ReturnType<typeof useThanosFront>;
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
    (_p, { thanosFront }) => (thanosFront.ready ? <Explore /> : <Welcome />)
  ],
  ["/create-wallet", onlyNotReady(() => <CreateWallet />)],
  ["/settings", onlyReady(() => <Settings />)],
  ["*", () => <Woozie.Redirect to="/" />]
]);

const Page: React.FC = () => {
  const { trigger, pathname } = Woozie.useLocation();

  // Scroll to top after new location pushed.
  React.useLayoutEffect(() => {
    if (trigger === Woozie.HistoryAction.Push) {
      window.scrollTo(0, 0);
    }
  }, [trigger, pathname]);

  const appEnv = useAppEnv();
  const thanosFront = useThanosFront();

  const ctx = React.useMemo<RouteContext>(() => ({ appEnv, thanosFront }), [
    appEnv,
    thanosFront
  ]);

  return Woozie.Router.resolve(ROUTE_MAP, pathname, ctx);
};

export default Page;

function onlyReady(factory: () => any) {
  return (_p: Woozie.Router.Params, { thanosFront }: RouteContext) =>
    thanosFront.ready ? factory() : Woozie.Router.SKIP;
}

function onlyNotReady(factory: () => any) {
  return (_p: Woozie.Router.Params, { thanosFront }: RouteContext) =>
    thanosFront.ready ? Woozie.Router.SKIP : factory();
}
