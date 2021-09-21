import { useCallback, useEffect, useMemo, useRef } from "react";

import BigNumber from "bignumber.js";
import constate from "constate";
import { trigger } from "swr";

import {
  BCD_NETWORKS_NAMES,
  getAccountTokenBalances,
  BcdNetwork,
} from "lib/better-call-dev";
import {
  useChainId,
  useAccount,
  isKnownChainId,
  toTokenSlug,
  useAssetsMetadata,
  AssetMetadata,
  useUSDPrices,
  fetchDisplayedFungibleTokens,
  PREDEFINED_MAINNET_TOKENS,
} from "lib/temple/front";
import * as Repo from "lib/temple/repo";
import { getTokensMetadata } from "lib/templewallet-api";

export const [SyncTokensProvider] = constate(() => {
  const chainId = useChainId(true)!;
  const { publicKeyHash: accountPkh } = useAccount();

  const { allTokensBaseMetadataRef, setTokensBaseMetadata, fetchMetadata } =
    useAssetsMetadata();
  const usdPrices = useUSDPrices();

  const networkId = useMemo(
    () =>
      (isKnownChainId(chainId!)
        ? BCD_NETWORKS_NAMES.get(chainId)
        : undefined) ?? null,
    [chainId]
  );

  const sync = useCallback(async () => {
    if (!networkId) return;
    const mainnet = networkId === "mainnet";

    const [bcdTokens, displayedFungibleTokens] = await Promise.all([
      fetchBcdTokenBalances(networkId, accountPkh),
      fetchDisplayedFungibleTokens(chainId, accountPkh),
    ]);

    const bcdTokensMap = new Map(
      bcdTokens.map((token) => [
        toTokenSlug(token.contract, token.token_id),
        token,
      ])
    );

    let tokenSlugs = Array.from(
      new Set([
        ...bcdTokensMap.keys(),
        ...displayedFungibleTokens.map(({ tokenSlug }) => tokenSlug),
        ...(mainnet ? PREDEFINED_MAINNET_TOKENS : []),
      ])
    );

    // let balances = await getAssetBalances({
    //   account: accountPkh,
    //   assetSlugs: tokenSlugs,
    // });

    const tokenRepoKeys = tokenSlugs.map((slug) =>
      Repo.toAccountTokenKey(chainId, accountPkh, slug)
    );

    const existingRecords = await Repo.accountTokens.bulkGet(tokenRepoKeys);

    const tokensMetadataToSet: Record<string, AssetMetadata> = {};

    const metadataSlugs = tokenSlugs.filter(
      (slug) => !(slug in allTokensBaseMetadataRef.current)
    );

    let metadatas;
    // Only for mainnet. Try load metadata from API.
    if (mainnet) {
      try {
        metadatas = await getTokensMetadata(metadataSlugs, 15_000);
      } catch {}
    }
    // Otherwise - fetch from chain.
    if (!metadatas) {
      metadatas = await Promise.all(
        metadataSlugs.map(async (slug) => {
          const noMetadataFlag = `no_metadata_${slug}`;
          if (!mainnet && localStorage.getItem(noMetadataFlag) === "true") {
            return null;
          }

          try {
            const { base } = await fetchMetadata(slug);
            return base;
          } catch {
            if (!mainnet) {
              localStorage.setItem(noMetadataFlag, "true");
            }

            return null;
          }
        })
      );
    }

    for (let i = 0; i < metadatas.length; i++) {
      const metadata = metadatas[i];
      if (metadata) tokensMetadataToSet[metadataSlugs[i]] = metadata;
    }

    await setTokensBaseMetadata(tokensMetadataToSet);

    await Repo.accountTokens.bulkPut(
      tokenSlugs.map((slug, i) => {
        const existing = existingRecords[i];
        // const balance = balances[i];
        const bcdToken = bcdTokensMap.get(slug);
        const balance = bcdToken?.balance ?? "0";
        const metadata =
          tokensMetadataToSet[slug] ?? allTokensBaseMetadataRef.current[slug];

        const price = usdPrices[slug];
        const usdBalance =
          price &&
          metadata &&
          new BigNumber(balance)
            .times(price)
            .div(10 ** metadata.decimals)
            .toFixed();

        if (existing) {
          return {
            ...existing,
            type: metadata?.artifactUri
              ? Repo.ITokenType.Collectible
              : Repo.ITokenType.Fungible,
            latestBalance: balance,
            latestUSDBalance: usdBalance,
          };
        }

        const status = PREDEFINED_MAINNET_TOKENS.includes(slug)
          ? Repo.ITokenStatus.Enabled
          : Repo.ITokenStatus.Idle;

        return {
          type: metadata?.artifactUri
            ? Repo.ITokenType.Collectible
            : Repo.ITokenType.Fungible,
          chainId,
          account: accountPkh,
          tokenSlug: slug,
          status,
          addedAt: Date.now(),
          latestBalance: balance,
          latestUSDBalance: usdBalance,
        };
      }),
      tokenRepoKeys
    );

    trigger(["displayed-fungible-tokens", chainId, accountPkh], true);
  }, [
    accountPkh,
    networkId,
    chainId,
    allTokensBaseMetadataRef,
    setTokensBaseMetadata,
    usdPrices,
    fetchMetadata,
  ]);

  const syncRef = useRef(sync);
  useEffect(() => {
    syncRef.current = sync;
  }, [sync]);

  const networkIdRef = useRef(networkId);
  if (networkIdRef.current !== networkId) {
    networkIdRef.current = networkId;
  }

  useEffect(() => {
    if (!networkId) {
      return;
    }

    const isTheSameNetwork = () => networkId === networkIdRef.current;
    let timeoutId: any;

    const syncAndDefer = async () => {
      try {
        await syncRef.current();
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }
      } finally {
        if (isTheSameNetwork()) {
          timeoutId = setTimeout(syncAndDefer, 30_000);
        }
      }
    };

    syncAndDefer();

    return () => clearTimeout(timeoutId);
  }, [networkId, accountPkh]);
});

async function fetchBcdTokenBalances(network: BcdNetwork, address: string) {
  const size = 10;

  let { total, balances } = await getAccountTokenBalances({
    network,
    address,
    size,
    offset: 0,
  });

  if (total > size) {
    const requests = Math.floor(total / size);
    const restResponses = await Promise.all(
      Array.from({ length: requests }).map((_, i) =>
        getAccountTokenBalances({
          network,
          address,
          size,
          offset: (i + 1) * size,
        })
      )
    );

    balances = [...balances, ...restResponses.map((r) => r.balances).flat()];
  }

  return balances;
}
