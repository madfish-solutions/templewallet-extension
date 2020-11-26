import * as React from "react";
import { useNetwork, useStorage, ThanosToken } from "lib/thanos/front";
import { ThanosAssetType } from "../types";
import { t } from "lib/i18n/react";
import { assetsAreSame } from "./assets";

export function useTokens() {
  const network = useNetwork();
  const [tokensPure, setTokens] = useStorage<ThanosToken[]>(
    `tokens_${network.id}`,
    []
  );
  const [hiddenTokensPure, setHiddenTokens] = useStorage<ThanosToken[]>(
    `hidden_tokens_${network.id}`,
    []
  );

  const tokens = React.useMemo(() => tokensPure.map(formatSaved), [tokensPure]);
  const hiddenTokens = React.useMemo(() => hiddenTokensPure.map(formatSaved), [
    hiddenTokensPure,
  ]);

  const addToken = React.useCallback(
    (token: ThanosToken) => {
      if (tokens.some((t) => assetsAreSame(t, token))) {
        if (token.type === ThanosAssetType.FA2) {
          throw new Error(
            t("fa2TokenAlreadyExists", [token.address, token.id])
          );
        } else {
          throw new Error(t("nonFa2TokenAlreadyExists", token.address));
        }
      }

      setTokens((tkns) => [...tkns, token]);
      setHiddenTokens((tkns) => tkns.filter((t) => !assetsAreSame(t, token)));
    },
    [tokens, setTokens, setHiddenTokens]
  );

  const removeToken = React.useCallback(
    (token: ThanosToken) => {
      setTokens((tkns) => tkns.filter((t) => !assetsAreSame(t, token)));
      setHiddenTokens((tkns) => [...tkns, token]);
    },
    [setTokens, setHiddenTokens]
  );

  return {
    tokens,
    hiddenTokens,
    setTokens,
    addToken,
    removeToken,
  };
}

function formatSaved(t: ThanosToken) {
  return { ...t, decimals: +t.decimals };
}
