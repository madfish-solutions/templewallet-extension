import React, { memo, useLayoutEffect, useMemo } from 'react';

import RootSuspenseFallback from 'app/a11y/RootSuspenseFallback';
import { OpenInFullPage, useAppEnv } from 'app/env';
import { AccountSettings } from 'app/pages/AccountSettings';
import AddAsset from 'app/pages/AddAsset/AddAsset';
import { Buy } from 'app/pages/Buy/Buy';
import Exolix from 'app/pages/Buy/Crypto/Exolix/Exolix';
import { BuyWithCreditCard } from 'app/pages/BuyWithCreditCard/BuyWithCreditCard';
import CollectiblePage from 'app/pages/Collectibles/CollectiblePage';
import ConnectLedger from 'app/pages/ConnectLedger/ConnectLedger';
import DApps from 'app/pages/DApps';
import Delegate from 'app/pages/Delegate';
import Home from 'app/pages/Home/Home';
import ImportAccount from 'app/pages/ImportAccount';
import ManageAssets from 'app/pages/ManageAssets';
import { CreateAnotherWallet } from 'app/pages/NewWallet/CreateAnotherWallet';
import { CreateWallet } from 'app/pages/NewWallet/CreateWallet';
import { ImportWallet } from 'app/pages/NewWallet/ImportWallet';
import AttentionPage from 'app/pages/Onboarding/pages/AttentionPage';
import Receive from 'app/pages/Receive/Receive';
import Send from 'app/pages/Send';
import Settings from 'app/pages/Settings/Settings';
import { Swap } from 'app/pages/Swap/Swap';
import Unlock from 'app/pages/Unlock/Unlock';
import Welcome from 'app/pages/Welcome/Welcome';
import { AliceBobWithdraw } from 'app/pages/Withdraw/Debit/AliceBob/AliceBobWithdraw';
import { Withdraw } from 'app/pages/Withdraw/Withdraw';
import { usePageRouterAnalytics } from 'lib/analytics';
import { Notifications, NotificationsItem } from 'lib/notifications/components';
import { useTempleClient } from 'lib/temple/front';
import * as Woozie from 'lib/woozie';

interface RouteContext {
  popup: boolean;
  fullPage: boolean;
  ready: boolean;
  locked: boolean;
}

type RouteFactory = Woozie.ResolveResult<RouteContext>;

const ROUTE_MAP = Woozie.createMap<RouteContext>([
  [
    '/import-wallet/:tabSlug?',
    (p, ctx) => {
      switch (true) {
        case ctx.ready:
          return Woozie.SKIP;

        case !ctx.fullPage:
          return <OpenInFullPage />;

        default:
          return <ImportWallet key={p.tabSlug ?? ''} tabSlug={p.tabSlug ?? undefined} />;
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
          return Woozie.SKIP;
      }
    }
  ],
  ['/loading', (_p, ctx) => (ctx.ready ? <Woozie.Redirect to={'/'} /> : <RootSuspenseFallback />)],
  ['/', (_p, ctx) => (ctx.ready ? <Home /> : <Welcome />)],
  [
    '/explore/:chainKind?/:chainId?/:assetSlug?',
    onlyReady(({ chainKind, chainId, assetSlug }) => (
      <Home chainKind={chainKind} chainId={chainId} assetSlug={assetSlug} />
    ))
  ],
  ['/create-wallet', onlyNotReady(() => <CreateWallet />)],
  ['/create-another-wallet', onlyReady(() => <CreateAnotherWallet />)],
  ['/import-account/:tabSlug?', onlyReady(({ tabSlug }) => <ImportAccount tabSlug={tabSlug} />)],
  ['/connect-ledger', onlyReady(onlyInFullPage(() => <ConnectLedger />))],
  ['/receive', onlyReady(() => <Receive />)],
  [
    '/send/:tezosChainId?/:assetSlug?',
    onlyReady(({ tezosChainId, assetSlug }) => <Send tezosChainId={tezosChainId} assetSlug={assetSlug} />)
  ],
  ['/swap', onlyReady(() => <Swap />)],
  ['/delegate/:tezosChainId', onlyReady(({ tezosChainId }) => <Delegate tezosChainId={tezosChainId!} />)],
  ['/dapps', onlyReady(() => <DApps />)],
  ['/manage-assets/:assetType?', onlyReady(({ assetType }) => <ManageAssets assetType={assetType!} />)],
  [
    '/collectible/:chainKind?/:chainId?/:assetSlug?',
    onlyReady(({ chainKind, chainId, assetSlug }) => (
      <CollectiblePage chainKind={chainKind!} chainId={chainId!} assetSlug={assetSlug!} />
    ))
  ],
  ['/add-asset', onlyReady(onlyInFullPage(() => <AddAsset />))],
  ['/settings/:tabSlug?', onlyReady(({ tabSlug }) => <Settings tabSlug={tabSlug} />)],
  ['/buy', onlyReady(onlyInFullPage(() => <Buy />))],
  ['/buy/crypto/exolix', onlyReady(onlyInFullPage(() => <Exolix />))],
  ['/buy/debit', onlyReady(onlyInFullPage(() => <BuyWithCreditCard />))],
  ['/withdraw', onlyReady(onlyInFullPage(() => <Withdraw />))],
  ['/withdraw/debit/alice-bob', onlyReady(onlyInFullPage(() => <AliceBobWithdraw />))],
  ['/attention', onlyReady(onlyInFullPage(() => <AttentionPage />))],
  ['/notifications', onlyReady(() => <Notifications />)],
  ['/notifications/:id', onlyReady(({ id }) => <NotificationsItem id={Number(id) ?? 0} />)],
  ['/account/:id', onlyReady(({ id }) => <AccountSettings id={id!} />)],
  ['*', () => <Woozie.Redirect to="/" />]
]);

export const PageRouter = memo(() => {
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

  return useMemo(() => Woozie.resolve(ROUTE_MAP, pathname, ctx), [pathname, ctx]);
});

function onlyReady(factory: RouteFactory): RouteFactory {
  return (params, ctx) => (ctx.ready ? factory(params, ctx) : Woozie.SKIP);
}

function onlyNotReady(factory: RouteFactory): RouteFactory {
  return (params, ctx) => (ctx.ready ? Woozie.SKIP : factory(params, ctx));
}

function onlyInFullPage(factory: RouteFactory): RouteFactory {
  return (params, ctx) => (!ctx.fullPage ? <OpenInFullPage /> : factory(params, ctx));
}
