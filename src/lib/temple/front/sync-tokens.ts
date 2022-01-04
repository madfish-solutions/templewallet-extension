import { useCallback, useEffect, useMemo, useRef } from 'react';

import BigNumber from 'bignumber.js';
import constate from 'constate';
import { trigger } from 'swr';

import { BCD_NETWORKS_NAMES, getAccountTokenBalances, BcdNetwork, BcdAccountTokenBalance } from 'lib/better-call-dev';
import {
  useChainId,
  useAccount,
  isKnownChainId,
  toTokenSlug,
  useTokensMetadata,
  AssetMetadata,
  useUSDPrices,
  fetchDisplayedFungibleTokens,
  PREDEFINED_MAINNET_TOKENS,
  fetchCollectibleTokens,
  toBaseMetadata,
  DetailedAssetMetdata
} from 'lib/temple/front';
import * as Repo from 'lib/temple/repo';
import { getTokensMetadata } from 'lib/templewallet-api';

export const [SyncTokensProvider] = constate(() => {
  const chainId = useChainId(true)!;
  const { publicKeyHash: accountPkh } = useAccount();

  const { allTokensBaseMetadataRef, setTokensBaseMetadata, setTokensDetailedMetadata, fetchMetadata } =
    useTokensMetadata();
  const usdPrices = useUSDPrices();

  const networkId = useMemo(
    () => (isKnownChainId(chainId) ? BCD_NETWORKS_NAMES.get(chainId) : undefined) ?? null,
    [chainId]
  );

  const sync = useCallback(async () => {
    makeSync(
      accountPkh,
      networkId,
      chainId,
      allTokensBaseMetadataRef,
      setTokensBaseMetadata,
      setTokensDetailedMetadata,
      usdPrices,
      fetchMetadata
    );
  }, [
    accountPkh,
    networkId,
    chainId,
    allTokensBaseMetadataRef,
    setTokensBaseMetadata,
    setTokensDetailedMetadata,
    usdPrices,
    fetchMetadata
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
      } catch (err: any) {
        console.error(err);
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
    offset: 0
  });

  if (total > size) {
    const requests = Math.floor(total / size);
    const restResponses = await Promise.all(
      Array.from({ length: requests }).map((_, i) =>
        getAccountTokenBalances({
          network,
          address,
          size,
          offset: (i + 1) * size
        })
      )
    );

    balances = [...balances, ...restResponses.map(r => r.balances).flat()];
  }

  return balances;
}

const makeSync = async (
  accountPkh: string,
  networkId: BcdNetwork | null,
  chainId: string,
  allTokensBaseMetadataRef: any,
  setTokensBaseMetadata: any,
  setTokensDetailedMetadata: any,
  usdPrices: Record<string, string>,
  fetchMetadata: any
) => {
  if (!networkId) return;
  const mainnet = networkId === 'mainnet';

  const [bcdTokens, displayedFungibleTokens, displayedCollectibleTokens] = await Promise.all([
    fetchBcdTokenBalances(networkId, accountPkh),
    fetchDisplayedFungibleTokens(chainId, accountPkh),
    fetchCollectibleTokens(chainId, accountPkh, true)
  ]);

  const bcdTokensMap = new Map(bcdTokens.map(token => [toTokenSlug(token.contract, token.token_id), token]));

  const displayedTokenSlugs = [...displayedFungibleTokens, ...displayedCollectibleTokens].map(
    ({ tokenSlug }) => tokenSlug
  );

  let tokenSlugs = Array.from(
    new Set([...bcdTokensMap.keys(), ...displayedTokenSlugs, ...(mainnet ? PREDEFINED_MAINNET_TOKENS : [])])
  );

  const tokenRepoKeys = tokenSlugs.map(slug => Repo.toAccountTokenKey(chainId, accountPkh, slug));

  const existingRecords = await Repo.accountTokens.bulkGet(tokenRepoKeys);

  const metadataSlugs = tokenSlugs.filter(slug => !(slug in allTokensBaseMetadataRef.current));

  let metadatas;
  // Only for mainnet. Try load metadata from API.
  if (mainnet) {
    try {
      const response = await getTokensMetadata(metadataSlugs, 15_000);
      metadatas = response.map(data => data && { base: toBaseMetadata(data), detailed: data });
    } catch {}
  }
  // Otherwise - fetch from chain.
  if (!metadatas) {
    metadatas = await Promise.all(metadataSlugs.map(slug => generateMetadataRequest(slug, mainnet, fetchMetadata)));
  }

  const baseMetadatasToSet: Record<string, AssetMetadata> = {};
  const detailedMetadatasToSet: Record<string, DetailedAssetMetdata> = {};

  for (let i = 0; i < metadatas.length; i++) {
    const data = metadatas[i];

    if (data) {
      const slug = metadataSlugs[i];
      const { base, detailed } = data;

      baseMetadatasToSet[slug] = base;
      detailedMetadatasToSet[slug] = detailed;
    }
  }

  await setTokensBaseMetadata(baseMetadatasToSet);
  await setTokensDetailedMetadata(detailedMetadatasToSet);

  await Repo.accountTokens.bulkPut(
    tokenSlugs.map((slug, i) =>
      updateTokenSlugs(
        slug,
        i,
        chainId,
        accountPkh,
        existingRecords,
        bcdTokensMap,
        baseMetadatasToSet,
        allTokensBaseMetadataRef,
        usdPrices
      )
    ),
    tokenRepoKeys
  );

  trigger(['displayed-fungible-tokens', chainId, accountPkh], true);
};

const generateMetadataRequest = async (slug: string, mainnet: boolean, fetchMetadata: any) => {
  const noMetadataFlag = `no_metadata_${slug}`;
  if (!mainnet && localStorage.getItem(noMetadataFlag) === 'true') {
    return null;
  }

  try {
    return await fetchMetadata(slug);
  } catch {
    if (!mainnet) {
      localStorage.setItem(noMetadataFlag, 'true');
    }

    return null;
  }
};

const updateTokenSlugs = (
  slug: string,
  i: number,
  chainId: string,
  accountPkh: string,
  existingRecords: (Repo.IAccountToken | undefined)[],
  bcdTokensMap: Map<string, BcdAccountTokenBalance>,
  baseMetadatasToSet: any,
  allTokensBaseMetadataRef: any,
  usdPrices: Record<string, string>
) => {
  const existing = existingRecords[i];
  const bcdToken = bcdTokensMap.get(slug);
  const balance = bcdToken?.balance ?? '0';
  const metadata = baseMetadatasToSet[slug] ?? allTokensBaseMetadataRef.current[slug];

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
      type: metadata?.artifactUri ? Repo.ITokenType.Collectible : Repo.ITokenType.Fungible,
      latestBalance: balance,
      latestUSDBalance: usdBalance
    };
  }

  const status = PREDEFINED_MAINNET_TOKENS.includes(slug) ? Repo.ITokenStatus.Enabled : Repo.ITokenStatus.Idle;

  return {
    type: metadata?.artifactUri ? Repo.ITokenType.Collectible : Repo.ITokenType.Fungible,
    chainId,
    account: accountPkh,
    tokenSlug: slug,
    status,
    addedAt: Date.now(),
    latestBalance: balance,
    latestUSDBalance: usdBalance
  };
};
