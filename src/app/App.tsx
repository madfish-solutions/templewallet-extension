import React, { ComponentProps, FC, Suspense } from 'react';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import AwaitFonts from 'app/a11y/AwaitFonts';
import AwaitI18N from 'app/a11y/AwaitI18N';
import BootAnimation from 'app/a11y/BootAnimation';
import DisableOutlinesForClick from 'app/a11y/DisableOutlinesForClick';
import RootSuspenseFallback from 'app/a11y/RootSuspenseFallback';
import ConfirmPage from 'app/ConfirmPage';
import { AppEnvProvider } from 'app/env';
import ErrorBoundary from 'app/ErrorBoundary';
import Dialogs from 'app/layouts/Dialogs';
import PageRouter from 'app/PageRouter';
import { PropsWithChildren } from 'lib/props-with-children';
import { ABTestGroupProvider, TempleProvider } from 'lib/temple/front';
import { DialogsProvider } from 'lib/ui/dialog';
import * as Woozie from 'lib/woozie';

import { persistor, store } from './store/store';

interface AppProps extends Partial<PropsWithChildren> {
  env: ComponentProps<typeof AppEnvProvider>;
}

const App: FC<AppProps> = ({ env }) => (
  <ErrorBoundary whileMessage="booting a wallet" className="min-h-screen">
    <DialogsProvider>
      <Suspense fallback={<RootSuspenseFallback />}>
        <Provider store={store}>
          <PersistGate persistor={persistor} loading={null}>
            <AppProvider env={env}>
              <Dialogs />

              <DisableOutlinesForClick />

              <AwaitI18N />

              <AwaitFonts name="Inter" weights={[300, 400, 500, 600]} className="antialiased font-inter">
                <BootAnimation>{env.confirmWindow ? <ConfirmPage /> : <PageRouter />}</BootAnimation>
              </AwaitFonts>
            </AppProvider>
          </PersistGate>
        </Provider>
      </Suspense>
    </DialogsProvider>
  </ErrorBoundary>
);

export default App;

const AppProvider: FC<AppProps> = ({ children, env }) => (
  <AppEnvProvider {...env}>
    <ABTestGroupProvider>
      <Woozie.Provider>
        <TempleProvider>{children}</TempleProvider>
      </Woozie.Provider>
    </ABTestGroupProvider>
  </AppEnvProvider>
);
