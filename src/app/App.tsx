import React, { ComponentProps, FC, Suspense } from 'react';

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
import { DialogsProvider } from 'lib/ui/dialog';

import { AppProvider } from './AppProvider';

type AppProps = {
  env: ComponentProps<typeof AppEnvProvider>;
};

const App: FC<AppProps> = ({ env }) => (
  <ErrorBoundary whileMessage="booting a wallet" className="min-h-screen">
    <DialogsProvider>
      <Suspense fallback={<RootSuspenseFallback />}>
        <AppProvider env={env}>
          <Dialogs />

          <DisableOutlinesForClick />

          <AwaitI18N />

          <AwaitFonts name="Inter" weights={[300, 400, 500, 600]} className="antialiased font-inter">
            <BootAnimation>{env.confirmWindow ? <ConfirmPage /> : <PageRouter />}</BootAnimation>
          </AwaitFonts>
        </AppProvider>
      </Suspense>
    </DialogsProvider>
  </ErrorBoundary>
);

export default App;
