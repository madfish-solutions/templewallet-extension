import * as React from "react";
import * as Woozie from "lib/woozie";
import { useThanosClient } from "lib/thanos/front";
import { useAppEnv, OpenInFullPage } from "app/env";
import Unlock from "app/pages/Unlock";
import Welcome from "app/pages/Welcome";
import ImportWallet from "app/pages/ImportWallet";
import CreateWallet from "app/pages/CreateWallet";
import CreateAccount from "app/pages/CreateAccount";
import ImportAccount from "app/pages/ImportAccount";
import Explore from "app/pages/Explore";
import Receive from "app/pages/Receive";
import Send from "app/pages/Send";
import Settings from "app/pages/Settings";

interface RouteContext {
  appEnv: ReturnType<typeof useAppEnv>;
  thanos: ReturnType<typeof useThanosClient>;
}

type RouteFactory = Woozie.Router.ResolveResult<RouteContext>;

const ROUTE_MAP = Woozie.Router.createMap<RouteContext>([
  [
    "/import-wallet",
    (_p, { appEnv, thanos }) => {
      switch (true) {
        case thanos.ready:
          return Woozie.Router.SKIP;

        case !appEnv.fullPage:
          return <OpenInFullPage />;

        default:
          return <ImportWallet />;
      }
    },
  ],
  [
    "*",
    (_p, { appEnv, thanos }) => {
      switch (true) {
        case thanos.locked:
          return <Unlock />;

        case !thanos.ready && !appEnv.fullPage:
          return <OpenInFullPage />;

        default:
          return Woozie.Router.SKIP;
      }
    },
  ],
  ["/", (_p, { thanos }) => (thanos.ready ? <Explore /> : <Welcome />)],
  ["/create-wallet", onlyNotReady(() => <CreateWallet />)],
  ["/create-account", onlyReady(() => <CreateAccount />)],
  [
    "/import-account/:tabSlug?",
    onlyReady(({ tabSlug }) => <ImportAccount tabSlug={tabSlug} />),
  ],
  ["/receive", onlyReady(() => <Receive />)],
  ["/send", onlyReady(() => <Send />)],
  [
    "/settings/:tabSlug?",
    onlyReady(({ tabSlug }) => <Settings tabSlug={tabSlug} />),
  ],
  ["*", () => <Woozie.Redirect to="/" />],
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
  const thanos = useThanosClient();

  const ctx = React.useMemo<RouteContext>(() => ({ appEnv, thanos }), [
    appEnv,
    thanos,
  ]);

  return Woozie.Router.resolve(ROUTE_MAP, pathname, ctx);
};

export default Page;

function onlyReady(factory: RouteFactory): RouteFactory {
  return (params, ctx) =>
    ctx.thanos.ready ? factory(params, ctx) : Woozie.Router.SKIP;
}

function onlyNotReady(factory: RouteFactory): RouteFactory {
  return (params, ctx) =>
    ctx.thanos.ready ? Woozie.Router.SKIP : factory(params, ctx);
}
