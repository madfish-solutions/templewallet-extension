import * as React from "react";
import { LocationUpdates, ModifyLocation, createLocationState } from "./state";
import { HistoryAction, createUrl, navigate } from "./history";

interface RedirectProps {
  to: string | LocationUpdates | ModifyLocation;
}

const Redirect: React.FC<RedirectProps> = ({ to }) => {
  React.useEffect(() => {
    const lctn = createLocationState();
    const { pathname, search, hash, state }: LocationUpdates = (() => {
      switch (typeof to) {
        case "string":
          return { pathname: to };

        case "function":
          return to(lctn);

        case "object":
          return to;
      }
    })();

    const url = createUrl(pathname, search, hash);
    navigate(HistoryAction.Replace, state, url);
  }, [to]);

  return <LazyFake />;
};

export default Redirect;

const LazyFake = React.lazy(() => new Promise(() => {}));
