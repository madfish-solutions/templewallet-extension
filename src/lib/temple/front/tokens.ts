import * as React from "react";
import { cache, mutate } from "swr";
import {
  useNetwork,
  useStorage,
  TempleToken,
  TempleAssetType,
  useCustomChainId,
  fetchFromStorage,
  assetsAreSame,
  mergeAssets,
  omitAssets,
  loadChainId,
  TempleChainId,
  MAINNET_TOKENS,
  DELPHINET_TOKENS,
} from "lib/temple/front";
import { t } from "lib/i18n/react";
import { useAllNetworks } from "./ready";

const NETWORK_TOKEN_MAP = new Map([
  [TempleChainId.Mainnet, MAINNET_TOKENS],
  [TempleChainId.Delphinet, DELPHINET_TOKENS],
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

  const [tokensPure, setTokens] = useStorage<TempleToken[]>(
    getTokensSWRKey(network.id),
    []
  );
  const [hiddenTokensPure, setHiddenTokens] = useStorage<TempleToken[]>(
    getHiddenTokensSWRKey(network.id),
    []
  );

  const chainId = useCustomChainId(network.rpcBaseURL, true);

  const tokens = React.useMemo(() => tokensPure.map(formatSaved), [tokensPure]);
  const hiddenTokens = React.useMemo(() => hiddenTokensPure.map(formatSaved), [
    hiddenTokensPure,
  ]);

  const allTokens = React.useMemo(
    () =>
      mergeAssets(
        (chainId && NETWORK_TOKEN_MAP.get(chainId as TempleChainId)) || [],
        tokens
      ),
    [chainId, tokens]
  );

  const displayedTokens = React.useMemo(
    () => omitAssets(allTokens, hiddenTokens),
    [allTokens, hiddenTokens]
  );

  const addToken = React.useCallback(
    (token: TempleToken) => {
      if (tokens.some((t) => assetsAreSame(t, token))) {
        if (token.type === TempleAssetType.FA2) {
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
    (token: TempleToken) => {
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

export async function preloadTokens(netId: string, rpcUrl: string) {
  const tokensKey = getTokensSWRKey(netId);
  const hiddenTokensKey = getHiddenTokensSWRKey(netId);

  await Promise.all(
    [
      {
        key: tokensKey,
        factory: () => fetchFromStorage(tokensKey),
      },
      {
        key: hiddenTokensKey,
        factory: () => fetchFromStorage(hiddenTokensKey),
      },
      {
        key: getCustomChainIdSWRKey(rpcUrl),
        factory: () => loadChainId(rpcUrl),
      },
    ]
      .filter(({ key }) => !cache.has(key))
      .map(({ key, factory }) => mutate(key, factory))
  );
}

export function getTokensSWRKey(netId: string) {
  return `tokens_${netId}`;
}

export function getHiddenTokensSWRKey(netId: string) {
  return `hidden_tokens_${netId}`;
}

export function getCustomChainIdSWRKey(rpcUrl: string) {
  return ["custom-chain-id", rpcUrl];
}

function formatSaved(t: TempleToken) {
  return { ...t, decimals: +t.decimals };
}
