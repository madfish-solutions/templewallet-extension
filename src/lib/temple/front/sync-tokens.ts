import { useCallback, useEffect, useMemo, useRef } from "react";

import constate from "constate";

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
} from "lib/temple/front";
import * as Repo from "lib/temple/repo";

export const [SyncTokensProvider] = constate(() => {
  const chainId = useChainId(true)!;
  const { publicKeyHash: accountPkh } = useAccount();
  const { allTokensBaseMetadata, fetchMetadata, setTokensBaseMetadata } =
    useTokensMetadata();

  const networkId = useMemo(
    () =>
      (isKnownChainId(chainId!)
        ? BCD_NETWORKS_NAMES.get(chainId)
        : undefined) ?? null,
    [chainId]
  );

  const sync = useCallback(async () => {
    if (!networkId) {
      return;
    }

    const balances = await fetchBcdTokenBalances(networkId, accountPkh);

    const tokenSlugs: string[] = [];
    const tokenRepoKeys: string[] = [];
    for (const token of balances) {
      const slug = toTokenSlug(token.contract, token.token_id);
      tokenSlugs.push(slug);
      tokenRepoKeys.push(Repo.toAccountTokenKey(chainId, accountPkh, slug));
    }

    const existingRecords = await Repo.accountTokens.bulkGet(tokenRepoKeys);
    const tokensMetadataToSet: Record<string, AssetMetadata> = {};

    await Promise.all(
      tokenSlugs.map(async (slug) => {
        if (slug in allTokensBaseMetadata) return;
        try {
          const { base } = await fetchMetadata(slug);
          tokensMetadataToSet[slug] = base;
        } catch {}
      })
    );

    await setTokensBaseMetadata(tokensMetadataToSet);

    await Repo.accountTokens.bulkPut(
      balances.map((token, i) => {
        const existing = existingRecords[i];

        if (existing) {
          return {
            ...existing,
            latestBalance: token.balance,
          };
        }

        return {
          type: token.artifact_uri
            ? Repo.ITokenType.Collectible
            : Repo.ITokenType.Fungible,
          chainId,
          account: accountPkh,
          tokenSlug: tokenSlugs[i],
          status: Repo.ITokenStatus.Idle,
          addedAt: Date.now(),
          latestBalance: token.balance,
        };
      }),
      tokenRepoKeys
    );
  }, [
    accountPkh,
    networkId,
    chainId,
    allTokensBaseMetadata,
    fetchMetadata,
    setTokensBaseMetadata,
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
          timeoutId = setTimeout(syncAndDefer, 60_000);
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
