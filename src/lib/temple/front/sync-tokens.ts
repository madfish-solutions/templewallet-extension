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
  useTokensMetadata,
  AssetMetadata,
  useUSDPrices,
} from "lib/temple/front";
import * as Repo from "lib/temple/repo";
import { getAssetBalances, getTokensMetadata } from "lib/templewallet-api";

export const [SyncTokensProvider] = constate(() => {
  const chainId = useChainId(true)!;
  const { publicKeyHash: accountPkh } = useAccount();
  const { allTokensBaseMetadataRef, setTokensBaseMetadata } =
    useTokensMetadata();
  const usdPrices = useUSDPrices();

  const networkId = useMemo(
    () =>
      (isKnownChainId(chainId!)
        ? BCD_NETWORKS_NAMES.get(chainId)
        : undefined) ?? null,
    [chainId]
  );

  const sync = useCallback(async () => {
    if (networkId !== "mainnet") return;

    const bcdTokens = await fetchBcdTokenBalances(networkId, accountPkh);

    let tokenSlugs = bcdTokens.map((token) =>
      toTokenSlug(token.contract, token.token_id)
    );

    let balances = await getAssetBalances({
      account: accountPkh,
      assetSlugs: tokenSlugs,
    });

    const tokenRepoKeys = tokenSlugs.map((slug) =>
      Repo.toAccountTokenKey(chainId, accountPkh, slug)
    );

    const existingRecords = await Repo.accountTokens.bulkGet(tokenRepoKeys);

    const tokensMetadataToSet: Record<string, AssetMetadata> = {};

    const metadataSlugs = tokenSlugs.filter(
      (slug) => !(slug in allTokensBaseMetadataRef.current)
    );
    const metadatas = await getTokensMetadata(metadataSlugs);
    for (let i = 0; i < metadatas.length; i++) {
      const metadata = metadatas[i];
      if (metadata) tokensMetadataToSet[metadataSlugs[i]] = metadata;
    }

    await setTokensBaseMetadata(tokensMetadataToSet);

    await Repo.accountTokens.bulkPut(
      tokenSlugs.map((slug, i) => {
        const existing = existingRecords[i];
        const balance = balances[i];
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
            latestBalance: balance,
            latestUSDBalance: usdBalance,
          };
        }

        return {
          // TODO: Uncomment when Collectible view is implemented
          // type: metadata?.artifactUri
          //   ? Repo.ITokenType.Collectible
          //   : Repo.ITokenType.Fungible,
          type: Repo.ITokenType.Fungible,
          chainId,
          account: accountPkh,
          tokenSlug: slug,
          status: Repo.ITokenStatus.Idle,
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
