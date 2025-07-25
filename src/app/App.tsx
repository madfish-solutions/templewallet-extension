import React, { PropsWithChildren, ComponentProps, FC, Suspense, useMemo } from 'react';

import 'lib/local-storage/migrations';
import 'lib/ledger/proxy/foreground';
import 'lib/keep-bg-worker-alive/script';

import AwaitFontFamily from 'app/a11y/AwaitFonts';
import AwaitI18N from 'app/a11y/AwaitI18N';
import BootAnimation from 'app/a11y/BootAnimation';
import DisableOutlinesForClick from 'app/a11y/DisableOutlinesForClick';
import RootSuspenseFallback from 'app/a11y/RootSuspenseFallback';
import ConfirmPage from 'app/ConfirmPage';
import { AppEnvProvider, WindowType } from 'app/env';
import ErrorBoundary from 'app/ErrorBoundary';
import Dialogs from 'app/layouts/Dialogs';
import { PageRouter } from 'app/PageRouter';
import { TempleProvider, useTempleClient } from 'lib/temple/front';
import { DialogsProvider } from 'lib/ui/dialog';
import * as Woozie from 'lib/woozie';

import { LoadHypelabScript } from './load-hypelab-script';
import { AppRootHooks, ConfirmWindowRootHooks } from './root-hooks';
import { StoreProvider } from './store/provider';
import { ToasterProvider } from './toaster';

interface Props extends PropsWithChildren {
  env: ComponentProps<typeof AppEnvProvider>;
}

export const App: FC<Props> = ({ env }) => (
  <ErrorBoundary whileMessage="booting a wallet" className="min-h-screen">
    <DialogsProvider>
      <Suspense fallback={<RootSuspenseFallback />}>
        <AppProvider env={env}>
          <Dialogs />

          <DisableOutlinesForClick />

          <AwaitI18N />

          <LoadHypelabScript />

          <AwaitFonts>
            <BootAnimation>
              {env.confirmWindow ? (
                <ConfirmContent />
              ) : env.windowType === WindowType.Sidebar ? (
                <SidebarContent />
              ) : (
                <MainAppContent />
              )}
            </BootAnimation>
          </AwaitFonts>
        </AppProvider>
      </Suspense>
    </DialogsProvider>
  </ErrorBoundary>
);

const SidebarContent = () => {
  const { dAppQueueCounters } = useTempleClient();
  const location = Woozie.useLocation();

  const isConfirmation = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);

    return dAppQueueCounters.length && searchParams.has('id') && searchParams.size === 1 && location.pathname === '/';
  }, [dAppQueueCounters.length, location.pathname, location.search]);

  return isConfirmation ? <ConfirmContent /> : <MainAppContent />;
};

const ConfirmContent = () => (
  <>
    <ConfirmWindowRootHooks />
    <ConfirmPage />
    <ToasterProvider />
  </>
);

const MainAppContent = () => (
  <>
    <AppRootHooks />
    <PageRouter />
    <ToasterProvider />
  </>
);

const AppProvider: FC<Props> = ({ children, env }) => (
  <AppEnvProvider {...env}>
    <StoreProvider>
      <Woozie.Provider>
        <TempleProvider>{children}</TempleProvider>
      </Woozie.Provider>
    </StoreProvider>
  </AppEnvProvider>
);

const FONTS_WEIGHTS = [300, 400, 500, 600];

const AwaitFonts: FC<PropsWithChildren> = ({ children }) => (
  <AwaitFontFamily name="Inter" weights={FONTS_WEIGHTS} className="antialiased font-inter">
    <AwaitFontFamily name="Rubik" weights={FONTS_WEIGHTS} className="antialiased">
      {children}
    </AwaitFontFamily>
  </AwaitFontFamily>
);
