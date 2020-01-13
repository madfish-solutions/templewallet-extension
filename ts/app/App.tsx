import * as React from "react";
import { Router, Switch, Route } from "wouter";
import useHashLocation from "lib/react/useHashLocation";

const App: React.FC = () => (
  <Router hook={useHashLocation}>
    <Switch>
      <Route path="/faq" component={Faq} />
      <Route path="/:term*" component={Explore} />
    </Switch>
  </Router>
);

export default App;

const Explore: React.FC = () => <>Explore</>;
const Faq: React.FC = () => <>FAQ</>;
