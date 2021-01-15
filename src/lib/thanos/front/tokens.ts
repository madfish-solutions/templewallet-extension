import * as React from "react";
import { cache, mutate } from "swr";
import {
  useNetwork,
  useStorage,
  ThanosToken,
  ThanosAssetType,
  fetchFromStorage,
  assetsAreSame,
  mergeAssets,
  omitAssets,
  MAINNET_TOKENS,
  DELPHINET_TOKENS,
} from "lib/thanos/front";
import { t } from "lib/i18n/react";
import { useAllNetworks } from "./ready";

const NETWORK_TOKEN_MAP = new Map([
  ["mainnet", MAINNET_TOKENS],
  ["delphinet", DELPHINET_TOKENS],
]);

export function useTokens(networkRpc?: string) {
  const allNetworks = useAllNetworks();
  const selectedNetwork = useNetwork();

  const network = React.useMemo(() => {
    if (!networkRpc) return selectedNetwork;
    return (
      allNetworks.find(
        (n) => n.rpcBaseURL === networkRpc || n.id === networkRpc
      ) ?? selectedNetwork
    );
  }, [allNetworks, selectedNetwork, networkRpc]);

  const [tokensPure, setTokens] = useStorage<ThanosToken[]>(
    getTokensSWRKey(network.id),
    []
  );
  const [hiddenTokensPure, setHiddenTokens] = useStorage<ThanosToken[]>(
    getHiddenTokensSWRKey(network.id),
    []
  );

  const tokens = React.useMemo(() => tokensPure.map(formatSaved), [tokensPure]);
  const hiddenTokens = React.useMemo(() => hiddenTokensPure.map(formatSaved), [
    hiddenTokensPure,
  ]);

  const allTokens = React.useMemo(
    () => mergeAssets(NETWORK_TOKEN_MAP.get(network.id) ?? [], tokens),
    [network.id, tokens]
  );

  const displayedTokens = React.useMemo(
    () => omitAssets(allTokens, hiddenTokens),
    [allTokens, hiddenTokens]
  );

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
      setHiddenTokens((tkns) => [token, ...tkns]);
    },
    [setTokens, setHiddenTokens]
  );

  return {
    tokens,
    hiddenTokens,
    allTokens,
    displayedTokens,
    setTokens,
    addToken,
    removeToken,
  };
}

export async function preloadTokens(netId: string) {
  const tokensKey = getTokensSWRKey(netId);
  const hiddenTokensKey = getHiddenTokensSWRKey(netId);
  if (!cache.has(tokensKey) || !cache.has(hiddenTokensKey)) {
    await Promise.all([
      mutate(getTokensSWRKey(netId), () => fetchFromStorage(tokensKey)),
      mutate(getHiddenTokensSWRKey(netId), () =>
        fetchFromStorage(hiddenTokensKey)
      ),
    ]);
  }
}

export function getTokensSWRKey(netId: string) {
  return `tokens_${netId}`;
}

export function getHiddenTokensSWRKey(netId: string) {
  return `hidden_tokens_${netId}`;
}

function formatSaved(t: ThanosToken) {
  return { ...t, decimals: +t.decimals };
}
