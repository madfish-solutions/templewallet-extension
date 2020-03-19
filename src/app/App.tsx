import * as React from "react";
import * as Woozie from "lib/woozie";
import { ThanosProvider } from "lib/thanos/front";
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
      <ThanosProvider>{children}</ThanosProvider>
    </Woozie.Provider>
  </AppEnvProvider>
);

const rootEl = document.getElementById("root")!;

const baseClassNames = ["transform"];
const initialClassNames = ["scale-105", "opacity-0"];
const transitionClassNames = ["transition", "ease", "duration-200"];

rootEl.classList.add(...baseClassNames, ...initialClassNames);

const AppSuspenseFallback: React.FC = () => {
  React.useEffect(
    () => () => {
      rootEl.classList.add(...transitionClassNames);
      rootEl.classList.remove(...initialClassNames);
      setTimeout(() => {
        rootEl.classList.remove(...baseClassNames, ...transitionClassNames);
      }, 200);
    },
    []
  );

  return null;
};
