import React, { FC, useLayoutEffect, useMemo } from 'react';

import RootSuspenseFallback from 'app/a11y/RootSuspenseFallback';
import { OpenInFullPage, useAppEnv } from 'app/env';
import AddAsset from 'app/pages/AddAsset/AddAsset';
import { Buy } from 'app/pages/Buy/Buy';
import Exolix from 'app/pages/Buy/Crypto/Exolix/Exolix';
import { BuyWithCreditCard } from 'app/pages/BuyWithCreditCard/BuyWithCreditCard';
import CollectiblePage from 'app/pages/Collectibles/CollectiblePage';
import ConnectLedger from 'app/pages/ConnectLedger/ConnectLedger';
import CreateAccount from 'app/pages/CreateAccount/CreateAccount';
import DApps from 'app/pages/DApps';
import Delegate from 'app/pages/Delegate';
import Home from 'app/pages/Home/Home';
import ImportAccount from 'app/pages/ImportAccount';
import ManageAssets from 'app/pages/ManageAssets';
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

import { RewardsPage } from './pages/Rewards';
import { StakingPage } from './pages/Staking';
import { WithDataLoading } from './WithDataLoading';

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
  ['/explore/:assetSlug?', onlyReady(({ assetSlug }) => <Home assetSlug={assetSlug} />)],
  ['/create-wallet', onlyNotReady(() => <CreateWallet />)],
  ['/create-account', onlyReady(() => <CreateAccount />)],
  ['/import-account/:tabSlug?', onlyReady(({ tabSlug }) => <ImportAccount tabSlug={tabSlug} />)],
  ['/connect-ledger', onlyReady(onlyInFullPage(() => <ConnectLedger />))],
  ['/receive', onlyReady(() => <Receive />)],
  ['/send/:assetSlug?', onlyReady(({ assetSlug }) => <Send assetSlug={assetSlug} />)],
  ['/swap', onlyReady(() => <Swap />)],
  ['/delegate', onlyReady(() => <Delegate />)],
  ['/staking', onlyReady(() => <StakingPage />)],
  ['/dapps', onlyReady(() => <DApps />)],
  ['/manage-assets/:assetType?', onlyReady(({ assetType }) => <ManageAssets assetType={assetType!} />)],
  ['/collectible/:assetSlug?', onlyReady(({ assetSlug }) => <CollectiblePage assetSlug={assetSlug!} />)],
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
  ['/rewards', onlyReady(() => <RewardsPage />)],
  ['*', () => <Woozie.Redirect to="/" />]
]);

export const PageRouter: FC = () => {
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

  return useMemo(() => {
    const routedElement = Woozie.resolve(ROUTE_MAP, pathname, ctx);

    return ctx.ready ? <WithDataLoading>{routedElement}</WithDataLoading> : routedElement;
  }, [pathname, ctx]);
};

function onlyReady(factory: RouteFactory): RouteFactory {
  return (params, ctx) => (ctx.ready ? factory(params, ctx) : Woozie.SKIP);
}

function onlyNotReady(factory: RouteFactory): RouteFactory {
  return (params, ctx) => (ctx.ready ? Woozie.SKIP : factory(params, ctx));
}

function onlyInFullPage(factory: RouteFactory): RouteFactory {
  return (params, ctx) => (!ctx.fullPage ? <OpenInFullPage /> : factory(params, ctx));
}
