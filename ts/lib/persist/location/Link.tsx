import * as React from "react";
import { LocationUpdates, ModifyLocation } from "./state";
import { HistoryAction, createUrl, navigate } from "./history";
import useLocationContext from "./useLocationContext";
import LinkAnchor from "./Link/Anchor";

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string | LocationUpdates | ModifyLocation;
  as?: React.ElementType;
  replace?: boolean;
}

const Link: React.FC<LinkProps> = ({
  to,
  as: Component = LinkAnchor,
  replace,
  ...rest
}) => {
  const lctn = useLocationContext();

  const {
    pathname,
    search,
    hash,
    state
  }: LocationUpdates = React.useMemo(() => {
    switch (typeof to) {
      case "string":
        return { pathname: to };

      case "function":
        return to(lctn);

      case "object":
        return to;
    }
  }, [lctn, to]);

  const url = React.useMemo(() => createUrl(pathname, search, hash), [
    pathname,
    search,
    hash
  ]);

  const currentUrl = React.useMemo(
    () => createUrl(lctn.pathname, lctn.search, lctn.hash),
    [lctn.pathname, lctn.search, lctn.hash]
  );

  const handleNavigate = React.useCallback(() => {
    const action =
      replace || url === currentUrl
        ? HistoryAction.Replace
        : HistoryAction.Push;
    navigate(action, state, url);
  }, [replace, state, url, currentUrl]);

  return <Component {...rest} href={url} navigate={handleNavigate} />;
};

export default Link;
