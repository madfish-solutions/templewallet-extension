import * as React from "react";
import * as Woozie from "lib/woozie";
import { ThanosProvider } from "lib/thanos/front";
import { AppEnvProvider } from "app/env";
import DisableOutlinesForClick from "app/a11y/DisableOutlinesForClick";
import AwaitFonts from "app/a11y/AwaitFonts";
import BootAnimation from "app/a11y/BootAnimation";
import ErrorBoundary from "app/ErrorBoundary";
import Page from "app/Page";

type AppProps = {
  env: React.ComponentProps<typeof AppEnvProvider>;
};

const App: React.FC<AppProps> = ({ env }) => (
  <ErrorBoundary whileMessage="booting a wallet" className="min-h-screen">
    <React.Suspense fallback={null}>
      <AppProvider env={env}>
        <DisableOutlinesForClick />

        <AwaitFonts
          name="Inter"
          weights={[300, 400, 500, 600]}
          className="font-inter antialiased"
        >
          <BootAnimation>
            <Page />
          </BootAnimation>
        </AwaitFonts>
      </AppProvider>
    </React.Suspense>
  </ErrorBoundary>
);

export default App;

const AppProvider: React.FC<AppProps> = ({ children, env }) => (
  <AppEnvProvider {...env}>
    <Woozie.Provider>
      <ThanosProvider>{children}</ThanosProvider>
    </Woozie.Provider>
  </AppEnvProvider>
);
