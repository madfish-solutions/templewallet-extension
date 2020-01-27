import * as React from "react";
import * as Woozie from "lib/woozie";
import {
  ThanosWalletProvider,
  useThanosWalletContext
} from "lib/thanos-wallet";

const App: React.FC = () => (
  <AppProvider>
    <React.Suspense fallback={null}>
      <Page />
    </React.Suspense>
  </AppProvider>
);

export default App;

const AppProvider: React.FC = ({ children }) => (
  <Woozie.Provider>
    <ThanosWalletProvider>{children}</ThanosWalletProvider>
  </Woozie.Provider>
);

const Page: React.FC = () => {
  const { trigger, pathname } = Woozie.useLocationContext();

  // Scroll to Top after new location pushed
  React.useEffect(() => {
    if (trigger === Woozie.HistoryAction.Push) {
      window.scrollTo(0, 0);
    }
  });

  return Woozie.Router.resolve(pathname, ROUTE_MAP);
};

const ROUTE_MAP = Woozie.Router.prepare([
  ["/", () => <Explore />],
  ["/faq", () => <Faq />],
  ["*", () => <NotFound />]
]);

const Explore: React.FC = () => {
  const { tezos } = useThanosWalletContext();

  React.useEffect(() => {
    console.info(tezos);
  }, [tezos]);

  return <>Explore</>;
};
const Faq: React.FC = () => <>FAQ</>;
const NotFound: React.FC = () => <>Not Found</>;
