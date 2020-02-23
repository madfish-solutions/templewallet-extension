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

const docEl = document.documentElement;
const transClassName = "scale-105";

docEl.classList.add("opacity-0", "transform", transClassName);

const AppSuspenseFallback: React.FC = () => {
  React.useEffect(
    () => () => {
      docEl.classList.add("transition", "easy-out", "duration-300");
      docEl.classList.remove("opacity-0", transClassName);
    },
    []
  );

  return null;
};
