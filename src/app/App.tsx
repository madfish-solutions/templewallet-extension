import * as React from "react";
import * as Woozie from "lib/woozie";
import { TezosProvider } from "lib/tezos";
import { ThanosWalletProvider } from "lib/thanos-wallet";
import { AppEnvironment, useAppEnvContext } from "app/env";
import PageLayout from "app/layout/PageLayout";
import ErrorBoundary from "app/ErrorBoundary";
import Page from "app/Page";

type AppProps = {
  env: AppEnvironment;
};

const App: React.FC<AppProps> = ({ env }) => (
  <ErrorBoundary>
    <React.Suspense fallback={<AppSuspenseFallback />}>
      <AppProvider env={env}>
        <PageLayout>
          <Page />
        </PageLayout>
      </AppProvider>
    </React.Suspense>
  </ErrorBoundary>
);

export default App;

const AppProvider: React.FC<AppProps> = ({ children, env }) => (
  <Woozie.Provider>
    <TezosProvider>
      <ThanosWalletProvider>
        <useAppEnvContext.Provider {...env}>
          {children}
        </useAppEnvContext.Provider>
      </ThanosWalletProvider>
    </TezosProvider>
  </Woozie.Provider>
);

const AppSuspenseFallback: React.FC = () => (
  <div className="w-full min-h-screen flex items-center justify-center">
    <div className="p-2 text-lg font-semibold text-gray-600">Loading...</div>
  </div>
);

// (async () => {
//   try {
//     const reply = await browser.runtime.sendMessage({ kek: "lal" });
//     console.info(reply);
//   } catch (err) {
//     console.error(err);
//   }
// })();
