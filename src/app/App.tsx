import * as React from "react";
import * as Woozie from "lib/woozie";
import { ThanosFrontProvider } from "lib/thanos/front";
import { AppEnvProvider } from "app/env";
import AwaitFonts from "app/a11y/AwaitFonts";
import DisableOutlinesForClick from "app/a11y/DisableOutlinesForClick";
import ErrorBoundary from "app/ErrorBoundary";
import Page from "app/Page";

type AppProps = {
  env: React.ComponentProps<typeof AppEnvProvider>;
};

const App: React.FC<AppProps> = ({ env }) => (
  <ErrorBoundary>
    <React.Suspense fallback={<AppSuspenseFallback />}>
      <AppProvider env={env}>
        <DisableOutlinesForClick />

        <AwaitFonts
          name="Inter"
          weights={[300, 400, 500, 600]}
          className="font-inter"
        >
          <Page />
        </AwaitFonts>
      </AppProvider>
    </React.Suspense>
  </ErrorBoundary>
);

export default App;

const AppProvider: React.FC<AppProps> = ({ children, env }) => (
  <AppEnvProvider {...env}>
    <Woozie.Provider>
      <ThanosFrontProvider>{children}</ThanosFrontProvider>
    </Woozie.Provider>
  </AppEnvProvider>
);

const AppSuspenseFallback: React.FC = () => (
  <div className="w-full min-h-screen flex items-center justify-center">
    <div className="p-2 text-lg font-semibold text-gray-600">Loading...</div>
  </div>
);
