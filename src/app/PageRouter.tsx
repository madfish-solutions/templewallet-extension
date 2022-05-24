import React, { FC, lazy, useLayoutEffect, useMemo } from 'react';

import { OpenInFullPage, useAppEnv } from 'app/env';
import { usePageRouterAnalytics } from 'lib/analytics';
import { useTempleClient } from 'lib/temple/front';
import * as Woozie from 'lib/woozie';

import AttentionPage from './pages/Onboarding/pages/AttentionPage';
import SelectCrypto from './pages/SelectCrypto/SelectCrypto';

const AddAsset = lazy(() => import('app/pages/AddAsset'));
const BuyCrypto = lazy(() => import('app/pages/BuyCrypto/BuyCrypto'));
const CollectiblePage = lazy(() => import('app/pages/Collectibles/CollectiblePage'));
const ConnectLedger = lazy(() => import('app/pages/ConnectLedger'));
const CreateAccount = lazy(() => import('app/pages/CreateAccount'));
const CreateWallet = lazy(() => import('app/pages/CreateWallet'));
const DApps = lazy(() => import('app/pages/DApps'));
const Delegate = lazy(() => import('app/pages/Delegate'));
const Explore = lazy(() => import('app/pages/Explore'));
const ImportAccount = lazy(() => import('app/pages/ImportAccount'));
const ImportWallet = lazy(() => import('app/pages/ImportWallet'));
const ManageAssets = lazy(() => import('app/pages/ManageAssets'));
const Receive = lazy(() => import('app/pages/Receive'));
const Send = lazy(() => import('app/pages/Send'));
const Settings = lazy(() => import('app/pages/Settings'));
const Swap = lazy(() => import('app/pages/Swap/Swap'));
const Unlock = lazy(() => import('app/pages/Unlock'));
const Welcome = lazy(() => import('app/pages/Welcome'));

interface RouteContext {
  popup: boolean;
  fullPage: boolean;
  ready: boolean;
  locked: boolean;
}

type RouteFactory = Woozie.Router.ResolveResult<RouteContext>;

const ROUTE_MAP = Woozie.Router.createMap<RouteContext>([
  [
    '/import-wallet/:tabSlug?',
    (p, ctx) => {
      switch (true) {
        case ctx.ready:
          return Woozie.Router.SKIP;

        case !ctx.fullPage:
          return <OpenInFullPage />;

        default:
          return <ImportWallet key={p.tabSlug ?? ''} tabSlug={p.tabSlug} />;
      }
    }
  ],
  [
    '*',
    (_p, ctx) => {
      switch (true) {
        case ctx.locked:
          return <Unlock />;

        case !ctx.ready && !ctx.fullPage:
          return <OpenInFullPage />;

        default:
          return Woozie.Router.SKIP;
      }
    }
  ],
  ['/', (_p, ctx) => (ctx.ready ? <Explore /> : <Welcome />)],
  ['/explore/:assetSlug?', onlyReady(({ assetSlug }) => <Explore assetSlug={assetSlug} />)],
  ['/create-wallet', onlyNotReady(() => <CreateWallet />)],
  ['/create-account', onlyReady(() => <CreateAccount />)],
  ['/import-account/:tabSlug?', onlyReady(({ tabSlug }) => <ImportAccount tabSlug={tabSlug} />)],
  ['/connect-ledger', onlyReady(onlyInFullPage(() => <ConnectLedger />))],
  ['/receive', onlyReady(() => <Receive />)],
  ['/send/:assetSlug?', onlyReady(({ assetSlug }) => <Send assetSlug={assetSlug} />)],
  ['/swap', onlyReady(() => <Swap />)],
  ['/delegate', onlyReady(() => <Delegate />)],
  ['/dapps', onlyReady(() => <DApps />)],
  ['/manage-assets/:assetType?', onlyReady(({ assetType }) => <ManageAssets assetType={assetType!} />)],
  ['/collectible/:assetSlug?', onlyReady(({ assetSlug }) => <CollectiblePage assetSlug={assetSlug!} />)],
  ['/add-asset', onlyReady(onlyInFullPage(() => <AddAsset />))],
  ['/settings/:tabSlug?', onlyReady(({ tabSlug }) => <Settings tabSlug={tabSlug} />)],
  ['/buy', onlyReady(onlyInFullPage(() => <SelectCrypto />))],
  ['/buy/crypto', onlyReady(onlyInFullPage(() => <BuyCrypto />))],
  ['/attention', onlyReady(onlyInFullPage(() => <AttentionPage />))],
  ['*', () => <Woozie.Redirect to="/" />]
]);

const PageRouter: FC = () => {
  const { trigger, pathname, search } = Woozie.useLocation();

  // Scroll to top after new location pushed.
  useLayoutEffect(() => {
    if (trigger === Woozie.HistoryAction.Push) {
      window.scrollTo(0, 0);
    }

    if (pathname === '/') {
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
      locked: temple.locked
    }),
    [appEnv.popup, appEnv.fullPage, temple.ready, temple.locked]
  );

  usePageRouterAnalytics(pathname, search, ctx.ready);

  return useMemo(() => Woozie.Router.resolve(ROUTE_MAP, pathname, ctx), [pathname, ctx]);
};

export default PageRouter;

function onlyReady(factory: RouteFactory): RouteFactory {
  return (params, ctx) => (ctx.ready ? factory(params, ctx) : Woozie.Router.SKIP);
}

function onlyNotReady(factory: RouteFactory): RouteFactory {
  return (params, ctx) => (ctx.ready ? Woozie.Router.SKIP : factory(params, ctx));
}

function onlyInFullPage(factory: RouteFactory): RouteFactory {
  return (params, ctx) => (!ctx.fullPage ? <OpenInFullPage /> : factory(params, ctx));
}
