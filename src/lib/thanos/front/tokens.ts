import * as React from "react";
import { useNetwork, useStorage, ThanosToken } from "lib/thanos/front";

export function useTokens() {
  const network = useNetwork();
  const [tokens, setTokens] = useStorage<ThanosToken[]>(
    `tokens_${network.id}`,
    []
  );

  const addToken = React.useCallback(
    (token: ThanosToken) => {
      setTokens((tkns) => [...tkns, token]);
    },
    [setTokens]
  );

  const removeToken = React.useCallback(
    (token: ThanosToken) => {
      setTokens((tkns) => tkns.filter((t) => t.address !== token.address));
    },
    [setTokens]
  );

  return {
    tokens,
    setTokens,
    addToken,
    removeToken,
  };
}
