import * as React from "react";
import { HashRouter as Router, Route } from "react-router-dom";

import ImportAccountFromFile from "app/views/ImportAccountFromFile";
import ImportAccountManual from "app/views/ImportAccountManual";

const View: React.FC = () => (
  <Router>
    <Route component={ImportAccountFromFile} path="/import/file" />
    <Route component={ImportAccountManual} path="/import/manual" />
  </Router>
);

export default View;
