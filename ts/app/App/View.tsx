import * as React from "react";
import { HashRouter as Router, Route, Redirect } from "react-router-dom";

import ImportAccountFromFile from "app/views/ImportAccountFromFile";
import ImportAccountManual from "app/views/ImportAccountManual";
import ExploreAccount from "app/views/ExploreAccount";

const View: React.FC = () => (
  <Router>
    <Redirect from="/" to="/account" />
    <Route component={ImportAccountFromFile} path="/import/file" />
    <Route component={ImportAccountManual} path="/import/manual" />
    <Route component={ExploreAccount} path="/account" />
  </Router>
);

export default View;
