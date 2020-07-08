import * as React from "react";
import { useNetwork, useStorage, ThanosToken } from "lib/thanos/front";

export function useTokens() {
  const network = useNetwork();
  const [tokensPure, setTokens] = useStorage<ThanosToken[]>(
    `tokens_${network.id}`,
    []
  );

  const tokens = React.useMemo(() => tokensPure.map(formatSaved), [tokensPure]);

  const addToken = React.useCallback(
    (token: ThanosToken) => {
      if (tokens.some((t) => t.symbol === token.symbol)) {
        throw new Error(`Token with '${token.symbol}' symbol already exists.`);
      }
      if (tokens.some((t) => t.name === token.name)) {
        throw new Error(`Token with '${token.name}' name already exists.`);
      }

      setTokens((tkns) => [...tkns, token]);
    },
    [tokens, setTokens]
  );

  const removeToken = React.useCallback(
    (token: ThanosToken) => {
      setTokens((tkns) => tkns.filter((t) => t.symbol !== token.symbol));
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

function formatSaved(t: ThanosToken) {
  return { ...t, decimals: +t.decimals };
}
