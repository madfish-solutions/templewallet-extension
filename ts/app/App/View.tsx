import * as React from "react";
import { HashRouter as Router, Route, Redirect } from "react-router-dom";

import ImportAccountFromFile from "app/views/ImportAccountFromFile";
import ImportAccountManual from "app/views/ImportAccountManual";
import ExploreAccount from "app/views/ExploreAccount";
import TransferFunds from "app/views/TransferFunds";
import ReceiveFunds from "app/views/ReceiveFunds";

const View: React.FC = () => (
  <Router>
    <Redirect from="/" to="/account/receive" />
    <Route component={ImportAccountFromFile} path="/import/file" />
    <Route component={ImportAccountManual} path="/import/manual" />
    <Route exact component={ExploreAccount} path="/account" />
    <Route component={TransferFunds} path="/account/transfer" />
    <Route component={ReceiveFunds} path="/account/receive" />
  </Router>
);

export default View;
