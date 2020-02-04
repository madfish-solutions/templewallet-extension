import * as React from "react";
import * as Woozie from "lib/woozie";
import { TezosProvider } from "lib/tezos";
import { ThanosWalletProvider } from "lib/thanos-wallet";
import PageLayout from "app/layout/PageLayout";
import ErrorBoundary from "app/ErrorBoundary";
import Page from "app/Page";

const App: React.FC<{ popup?: boolean }> = ({ popup }) => (
  <ErrorBoundary>
    <React.Suspense fallback={<AppSuspenseFallback />}>
      <AppProvider>
        <PageLayout popup={popup}>
          <Page />
        </PageLayout>
      </AppProvider>
    </React.Suspense>
  </ErrorBoundary>
);

export default App;

const AppProvider: React.FC = ({ children }) => (
  <Woozie.Provider>
    <TezosProvider>
      <ThanosWalletProvider>{children}</ThanosWalletProvider>
    </TezosProvider>
  </Woozie.Provider>
);

const AppSuspenseFallback: React.FC = () => (
  <div className="w-full min-h-screen flex items-center justify-center">
    <div className="p-2 text-lg font-semibold text-gray-600">Loading...</div>
  </div>
);
