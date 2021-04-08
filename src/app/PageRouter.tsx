import React, { FC, useEffect, useLayoutEffect, useMemo } from "react";

import { useAppEnv, OpenInFullPage } from "app/env";
import AddToken from "app/pages/AddToken";
import ConnectLedger from "app/pages/ConnectLedger";
import CreateAccount from "app/pages/CreateAccount";
import CreateWallet from "app/pages/CreateWallet";
import Delegate from "app/pages/Delegate";
import Explore from "app/pages/Explore";
import ImportAccount from "app/pages/ImportAccount";
import ImportWallet from "app/pages/ImportWallet";
import ManageAssets from "app/pages/ManageAssets";
import Receive from "app/pages/Receive";
import Send from "app/pages/Send";
import Settings from "app/pages/Settings";
import Unlock from "app/pages/Unlock";
import Welcome from "app/pages/Welcome";
import { useAnalytics } from "lib/analytics";
import { useTempleClient } from "lib/temple/front";
import * as Woozie from "lib/woozie";

interface RouteContext {
  popup: boolean;
  fullPage: boolean;
  ready: boolean;
  locked: boolean;
}

type RouteFactory = Woozie.Router.ResolveResult<RouteContext>;

const ROUTE_MAP = Woozie.Router.createMap<RouteContext>([
  [
    "/import-wallet",
    (_p, ctx) => {
      switch (true) {
        case ctx.ready:
          return Woozie.Router.SKIP;

        case !ctx.fullPage:
          return <OpenInFullPage />;

        default:
          return <ImportWallet />;
      }
    },
  ],
  [
    "*",
    (_p, ctx) => {
      switch (true) {
        case ctx.locked:
          return <Unlock />;

        case !ctx.ready && !ctx.fullPage:
          return <OpenInFullPage />;

        default:
          return Woozie.Router.SKIP;
      }
    },
  ],
  ["/", (_p, ctx) => (ctx.ready ? <Explore /> : <Welcome />)],
  [
    "/explore/:assetSlug?",
    onlyReady(({ assetSlug }) => <Explore assetSlug={assetSlug} />),
  ],
  ["/create-wallet", onlyNotReady(() => <CreateWallet />)],
  ["/create-account", onlyReady(() => <CreateAccount />)],
  [
    "/import-account/:tabSlug?",
    onlyReady(({ tabSlug }) => <ImportAccount tabSlug={tabSlug} />),
  ],
  ["/connect-ledger", onlyReady(() => <ConnectLedger />)],
  ["/receive", onlyReady(() => <Receive />)],
  [
    "/send/:assetSlug?",
    onlyReady(({ assetSlug }) => <Send assetSlug={assetSlug} />),
  ],
  ["/delegate", onlyReady(() => <Delegate />)],
  ["/manage-assets", onlyReady(() => <ManageAssets />)],
  ["/add-token", onlyReady(onlyInFullPage(() => <AddToken />))],
  [
    "/settings/:tabSlug?",
    onlyReady(({ tabSlug }) => <Settings tabSlug={tabSlug} />),
  ],
  ["*", () => <Woozie.Redirect to="/" />],
]);

const Page: FC = () => {
  const { trigger, pathname, search } = Woozie.useLocation();
  const { pageEvent } = useAnalytics();

  // Scroll to top after new location pushed.
  useLayoutEffect(() => {
    if (trigger === Woozie.HistoryAction.Push) {
      window.scrollTo(0, 0);
    }

    if (pathname === "/") {
      Woozie.resetHistoryPosition();
    }
  }, [trigger, pathname]);

  const appEnv = useAppEnv();
  const temple = useTempleClient();

  const ctx = useMemo<RouteContext>(
    () => ({
      popup: appEnv.popup,
      fullPage: appEnv.fullPage,
      ready: temple.ready,
      locked: temple.locked,
    }),
    [appEnv.popup, appEnv.fullPage, temple.ready, temple.locked]
  );

  useEffect(() => {
    let path = pathname;

    if (pathname === "/" && !ctx.ready) {
      path = "/welcome";
    }

    pageEvent(path, search);

  }, [pathname, search, ctx.ready, pageEvent]);

  return useMemo(() => Woozie.Router.resolve(ROUTE_MAP, pathname, ctx), [
    pathname,
    ctx,
  ]);
};

export default Page;

function onlyReady(factory: RouteFactory): RouteFactory {
  return (params, ctx) =>
    ctx.ready ? factory(params, ctx) : Woozie.Router.SKIP;
}

function onlyNotReady(factory: RouteFactory): RouteFactory {
  return (params, ctx) =>
    ctx.ready ? Woozie.Router.SKIP : factory(params, ctx);
}

function onlyInFullPage(factory: RouteFactory): RouteFactory {
  return (params, ctx) =>
    !ctx.fullPage ? <OpenInFullPage /> : factory(params, ctx);
}
