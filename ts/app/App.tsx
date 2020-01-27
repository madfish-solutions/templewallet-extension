import * as React from "react";
import { Router, Switch, Route } from "wouter";
import useHashLocation from "lib/react/useHashLocation";
import { useBrowserStorage } from "lib/browser";

const App: React.FC = () => (
  <React.Suspense fallback={null}>
    <Router hook={useHashLocation}>
      <Switch>
        <Route path="/faq" component={Faq} />
        <Route path="/:term*" component={Explore} />
      </Switch>
    </Router>
  </React.Suspense>
);

export default App;

const Explore: React.FC = () => {
  const [storageData, setStorageData] = useBrowserStorage(["kek", "lal"]);

  React.useEffect(() => {
    setTimeout(() => {
      (setStorageData as any)({ kek: "KEK", lal: "LAL" });
    }, 3000);
  }, []);

  return <>{JSON.stringify(storageData)} Explore</>;
};
const Faq: React.FC = () => <>FAQ</>;
