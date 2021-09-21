import React, { FC, useLayoutEffect, useMemo } from "react";

import { OpenInFullPage, useAppEnv } from "app/env";
import AddToken from "app/pages/AddToken";
import BuyCrypto from "app/pages/BuyCrypto/BuyCrypto";
import ConnectLedger from "app/pages/ConnectLedger";
import CreateAccount from "app/pages/CreateAccount";
import CreateWallet from "app/pages/CreateWallet";
import DApps from "app/pages/DApps";
import Delegate from "app/pages/Delegate";
import Explore from "app/pages/Explore";
import ImportAccount from "app/pages/ImportAccount";
import ImportWallet from "app/pages/ImportWallet";
import ManageAssets from "app/pages/ManageAssets";
import Receive from "app/pages/Receive";
import Send from "app/pages/Send";
import Settings from "app/pages/Settings";
import Swap from "app/pages/Swap";
import Unlock from "app/pages/Unlock";
import Welcome from "app/pages/Welcome";
import { usePageRouterAnalytics } from "lib/analytics";
import { useTempleClient } from "lib/temple/front";
import * as Woozie from "lib/woozie";
import CollectibleItem from "./pages/Collectibles/CollectibleItem";
import CollectiblePage from "./pages/Collectibles/CollectiblePage";

interface RouteContext {
  popup: boolean;
  fullPage: boolean;
  ready: boolean;
  locked: boolean;
}

type RouteFactory = Woozie.Router.ResolveResult<RouteContext>;

const ROUTE_MAP = Woozie.Router.createMap<RouteContext>([
  [
    "/import-wallet/:tabSlug?",
    (p, ctx) => {
      switch (true) {
        case ctx.ready:
          return Woozie.Router.SKIP;

        case !ctx.fullPage:
          return <OpenInFullPage />;

        default:
          return <ImportWallet key={p.tabSlug ?? ""} tabSlug={p.tabSlug} />;
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
  ["/connect-ledger", onlyReady(onlyInFullPage(() => <ConnectLedger />))],
  ["/receive", onlyReady(() => <Receive />)],
  [
    "/send/:assetSlug?",
    onlyReady(({ assetSlug }) => <Send assetSlug={assetSlug} />),
  ],
  [
    "/swap/:assetSlug?",
    onlyReady(({ assetSlug }) => <Swap assetSlug={assetSlug} />),
  ],
  ["/delegate", onlyReady(() => <Delegate />)],
  ["/dapps", onlyReady(() => <DApps />)],
  ["/manage-assets/:assetType?", onlyReady(({assetType}) => <ManageAssets assetType={assetType} />)],
  ["/collectible/:collectibleAddress?", onlyReady(
      ({collectibleAddress}) => <CollectiblePage address={collectibleAddress} />
  )],
  ["/add-token", onlyReady(onlyInFullPage(() => <AddToken />))],
  [
    "/settings/:tabSlug?",
    onlyReady(({ tabSlug }) => <Settings tabSlug={tabSlug} />),
  ],
  ["/buy", onlyReady(onlyInFullPage(() => <BuyCrypto />))],
  ["*", () => <Woozie.Redirect to="/" />],
]);

const Page: FC = () => {
  const { trigger, pathname, search } = Woozie.useLocation();

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

  usePageRouterAnalytics(pathname, search, ctx.ready);

  return useMemo(
    () => Woozie.Router.resolve(ROUTE_MAP, pathname, ctx),
    [pathname, ctx]
  );
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
