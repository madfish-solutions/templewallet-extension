import * as React from "react";
import {
  HashRouter as Router,
  Route,
  Redirect,
  Switch
} from "react-router-dom";
import useThanosContext from "lib/useThanosContext";

import ImportAccountFromFile from "app/views/ImportAccountFromFile";
import ImportAccountManual from "app/views/ImportAccountManual";
import ExploreAccount from "app/views/ExploreAccount";
import TransferFunds from "app/views/TransferFunds";
import ReceiveFunds from "app/views/ReceiveFunds";

const View: React.FC = () => (
  <Router>
    <Switch>
      <RestrictedRoute
        exact
        path="/"
        switchComponent={(authorized: any) => (
          <Redirect to={authorized ? "/account" : "/import/manual"} />
        )}
      />

      <RestrictedRoute
        exact
        path="/import/file"
        switchComponent={(authorized: any, props: any) =>
          !authorized ? (
            <ImportAccountFromFile {...props} />
          ) : (
            <Redirect to="/" />
          )
        }
      />
      <RestrictedRoute
        exact
        path="/import/manual"
        switchComponent={(authorized: any, props: any) =>
          !authorized ? <ImportAccountManual {...props} /> : <Redirect to="/" />
        }
      />

      <RestrictedRoute
        exact
        path="/account"
        switchComponent={(authorized: any, props: any) =>
          authorized ? <ExploreAccount {...props} /> : <Redirect to="/" />
        }
      />
      <RestrictedRoute
        path="/account/transfer"
        switchComponent={(authorized: any, props: any) =>
          authorized ? <TransferFunds {...props} /> : <Redirect to="/" />
        }
      />
      <RestrictedRoute
        path="/account/receive"
        switchComponent={(authorized: any, props: any) =>
          authorized ? <ReceiveFunds {...props} /> : <Redirect to="/" />
        }
      />
    </Switch>
  </Router>
);

export default View;

const RestrictedRoute: React.FC<any> = ({ switchComponent, ...rest }) => {
  const { initialized, loading, authorized } = useThanosContext();

  if (!initialized || loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-sm font-medium text-gray-500 uppercase">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <Route {...rest} render={props => switchComponent(authorized, props)} />
  );
};
