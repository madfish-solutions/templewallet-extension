import * as React from "react";
import * as Woozie from "lib/woozie";
import { useThanosFront } from "lib/thanos/front";
import { useAppEnv, OpenInFullPage } from "app/env";
import Unlock from "app/pages/Unlock";
import Welcome from "app/pages/Welcome";
import ImportWallet from "app/pages/ImportWallet";
import CreateWallet from "app/pages/CreateWallet";
import Explore from "app/pages/Explore";
import Receive from "app/pages/Receive";
import Settings from "app/pages/Settings";

interface RouteContext {
  appEnv: ReturnType<typeof useAppEnv>;
  thanosFront: ReturnType<typeof useThanosFront>;
}

type RouteFactory = Woozie.Router.ResolveResult<RouteContext>;

const ROUTE_MAP = Woozie.Router.createMap<RouteContext>([
  [
    "/import-wallet",
    (_p, { appEnv, thanosFront }) => {
      switch (true) {
        case thanosFront.ready:
          return Woozie.Router.SKIP;

        case !appEnv.fullPage:
          return <OpenInFullPage />;

        default:
          return <ImportWallet />;
      }
    }
  ],
  [
    "*",
    (_p, { appEnv, thanosFront }) => {
      switch (true) {
        case thanosFront.locked:
          return <Unlock />;

        case !thanosFront.ready && !appEnv.fullPage:
          return <OpenInFullPage />;

        default:
          return Woozie.Router.SKIP;
      }
    }
  ],
  [
    "/",
    (_p, { thanosFront }) => (thanosFront.ready ? <Explore /> : <Welcome />)
  ],
  ["/create-wallet", onlyNotReady(() => <CreateWallet />)],
  ["/receive", onlyReady(() => <Receive />)],
  [
    "/settings/:tabSlug?",
    onlyReady(({ tabSlug }) => <Settings tabSlug={tabSlug} />)
  ],
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

function onlyReady(factory: RouteFactory): RouteFactory {
  return (params, ctx) =>
    ctx.thanosFront.ready ? factory(params, ctx) : Woozie.Router.SKIP;
}

function onlyNotReady(factory: RouteFactory): RouteFactory {
  return (params, ctx) =>
    ctx.thanosFront.ready ? Woozie.Router.SKIP : factory(params, ctx);
}
