import * as React from "react";
import { LocationTuple } from "wouter";

export default function useHashLocation() {
  const [lctn, setLctn] = React.useState(getCurrent);

  React.useEffect(() => {
    // subscribe on hash changes
    window.addEventListener("hashchange", handleHashchange);
    return () => {
      window.removeEventListener("hashchange", handleHashchange);
    };

    function handleHashchange() {
      setLctn(getCurrent);
    }
  }, [setLctn]);

  const navigate = React.useCallback((to: string) => {
    window.location.hash = to;
  }, []);

  return [lctn, navigate] as LocationTuple;
}

// Returns the current hash location (excluding the '#' symbol)
function getCurrent() {
  return window.location.hash.replace("#", "") || "/";
}
