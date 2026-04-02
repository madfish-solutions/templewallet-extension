import React, { memo, ReactNode, useLayoutEffect, useMemo } from 'react';

import RootSuspenseFallback from 'app/a11y/RootSuspenseFallback';
import { SuspenseContainer } from 'app/atoms/SuspenseContainer';
import { OpenInFullPage, useAppEnv } from 'app/env';
import { CollectiblePage } from 'app/pages/Collectibles/CollectiblePage';
import Home from 'app/pages/Home/Home';
import { Receive } from 'app/pages/Receive/Receive';
import Send from 'app/pages/Send';
import Unlock from 'app/pages/Unlock/Unlock';
import Welcome from 'app/pages/Welcome/Welcome';
import { usePageRouterAnalytics } from 'lib/analytics';
import { useTempleClient } from 'lib/temple/front';
import { TempleAccountType } from 'lib/temple/types';
import * as Woozie from 'lib/woozie';
import { useAccount } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { RewardsPushOverlay } from './layouts/PageLayout/RewardsPushOverlay';
import { ActivityPage } from './pages/Activity';
import { Dapps } from './pages/Dapps';
import { Notifications } from './pages/Notifications';
import { TokenPage } from './pages/Token';

// Lazy-loaded pages (heavy/rare routes)
const LazySwap = React.lazy(() => import('app/pages/Swap'));
const LazySettings = React.lazy(() => import('app/pages/Settings/Settings'));
const LazyEarn = React.lazy(() => import('./pages/Earn').then(m => ({ default: m.Earn })));
const LazyEarnTezPage = React.lazy(() => import('./pages/EarnTez').then(m => ({ default: m.EarnTezPage })));
const LazyEarnEthPage = React.lazy(() => import('./pages/EarnEth').then(m => ({ default: m.EarnEthPage })));
const LazyEarnTkeyPage = React.lazy(() => import('./pages/EarnTkey').then(m => ({ default: m.EarnTkeyPage })));
const LazyChainSettings = React.lazy(() => import('./pages/ChainSettings').then(m => ({ default: m.ChainSettings })));
const LazyAccountSettings = React.lazy(() =>
  import('./pages/AccountSettings').then(m => ({ default: m.AccountSettings }))
);
const LazyDebitCreditCard = React.lazy(() =>
  import('./pages/Buy/DebitCreditCard').then(m => ({ default: m.DebitCreditCard }))
);
const LazyCryptoExchange = React.lazy(() =>
  import('./pages/Buy/CryptoExchange').then(m => ({ default: m.CryptoExchange }))
);
const LazyRewardsPage = React.lazy(() => import('./pages/Rewards').then(m => ({ default: m.RewardsPage })));
const LazyImportWallet = React.lazy(() => import('./pages/ImportWallet').then(m => ({ default: m.ImportWallet })));

interface RouteContext {
  popup: boolean;
  fullPage: boolean;
  sidebar: boolean;
  ready: boolean;
  locked: boolean;
}

type RouteFactory = Woozie.ResolveResult<RouteContext>;

function lazily(element: ReactNode) {
  return <SuspenseContainer>{element}</SuspenseContainer>;
}

const RewardsRoute = memo(() => {
  const account = useAccount();

  if (account.type === TempleAccountType.WatchOnly) {
    return <Woozie.Redirect to="/" />;
  }

  return lazily(<LazyRewardsPage />);
});

const ROUTE_MAP = Woozie.createMap<RouteContext>([
  [
    '/import-wallet',
    (_p, ctx) => {
      if (ctx.ready) {
        return Woozie.SKIP;
      }

      if (!ctx.fullPage) {
        return <OpenInFullPage />;
      }

      return lazily(<LazyImportWallet />);
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
  ['/loading', (_p, ctx) => (ctx.ready ? <Woozie.Redirect to="/" /> : <RootSuspenseFallback />)],
  ['/', (_p, ctx) => (ctx.ready ? <Home /> : <Welcome />)],
  ['/activity', onlyReady(() => <ActivityPage />)],
  ['/receive/:chainKind?', onlyReady(({ chainKind }) => <Receive chainKind={chainKind} />)],
  [
    '/send/:chainKind?/:chainId?/:assetSlug?',
    onlyReady(({ chainKind, chainId, assetSlug }) => (
      <Send chainKind={chainKind} chainId={chainId} assetSlug={assetSlug} />
    ))
  ],
  ['/swap', onlyReady(() => lazily(<LazySwap />))],
  ['/earn', onlyReady(() => lazily(<LazyEarn />))],
  [
    '/earn-tez/:tezosChainId',
    onlyReady(({ tezosChainId }) => lazily(<LazyEarnTezPage tezosChainId={tezosChainId!} />))
  ],
  ['/earn-tkey', onlyReady(() => lazily(<LazyEarnTkeyPage />))],
  ['/earn-eth', onlyReady(() => lazily(<LazyEarnEthPage />))],
  [
    '/token/:chainKind?/:chainId?/:assetSlug?',
    onlyReady(({ chainKind, chainId, assetSlug }) => (
      <TokenPage chainKind={chainKind!} chainId={chainId!} assetSlug={assetSlug!} />
    ))
  ],
  [
    '/collectible/:chainKind?/:chainId?/:assetSlug?',
    onlyReady(({ chainKind, chainId, assetSlug }) => (
      <CollectiblePage chainKind={chainKind!} chainId={chainId!} assetSlug={assetSlug!} />
    ))
  ],
  [
    '/settings/networks/:chainKind/:chainId',
    onlyReady(({ chainId, chainKind }) =>
      lazily(<LazyChainSettings chainKind={chainKind as TempleChainKind} chainId={chainId!} />)
    )
  ],
  ['/settings/:tabSlug?', onlyReady(({ tabSlug }) => lazily(<LazySettings tabSlug={tabSlug} />))],
  ['/buy/card', onlyReady(() => lazily(<LazyDebitCreditCard />))],
  ['/buy/crypto', onlyReady(() => lazily(<LazyCryptoExchange />))],
  ['/notifications', onlyReady(() => <Notifications />)],
  ['/dapps', onlyReady(() => <Dapps />)],
  ['/account/:id', onlyReady(({ id }) => lazily(<LazyAccountSettings id={id!} />))],
  ['/rewards', onlyReady(() => <RewardsRoute />)],
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
      sidebar: appEnv.sidebar,
      ready: temple.ready,
      locked: temple.locked
    }),
    [appEnv.popup, appEnv.fullPage, appEnv.sidebar, temple.ready, temple.locked]
  );

  usePageRouterAnalytics(pathname, search, ctx.ready);

  const routeElement = useMemo(() => Woozie.resolve(ROUTE_MAP, pathname, ctx), [pathname, ctx]);

  return (
    <>
      {routeElement}
      <RewardsPushOverlay />
    </>
  );
});

function onlyReady(factory: RouteFactory): RouteFactory {
  return (params, ctx) => (ctx.ready ? factory(params, ctx) : Woozie.SKIP);
}
