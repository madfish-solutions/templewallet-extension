import { useCallback, useEffect, useRef } from 'react';

import BigNumber from 'bignumber.js';
import constate from 'constate';
import { useSWRConfig } from 'swr';
import { ScopedMutator } from 'swr/dist/types';

import {
  useChainId,
  useAccount,
  toTokenSlug,
  useTokensMetadata,
  AssetMetadata,
  useUSDPrices,
  fetchDisplayedFungibleTokens,
  fetchCollectibleTokens,
  toBaseMetadata,
  DetailedAssetMetdata,
  getPredefinedTokensSlugs
} from 'lib/temple/front';
import * as Repo from 'lib/temple/repo';
import { getTokensMetadata } from 'lib/templewallet-api';
import { fetchWhitelistTokenSlugs } from 'lib/templewallet-api/whitelist-tokens';
import { TzktAccountToken } from 'lib/tzkt';

import { TempleChainId } from '../types';
import { useFungibleTokens } from './fungible-tokens';
import { useNonFungibleTokens } from './non-fungible-tokens';

export const [SyncTokensProvider, useSyncTokens] = constate(() => {
  const { mutate } = useSWRConfig();
  const chainId = useChainId(true)!;
  const { tokens } = useFungibleTokens();
  const { nfts } = useNonFungibleTokens();
  const { publicKeyHash: accountPkh } = useAccount();

  const { allTokensBaseMetadataRef, setTokensBaseMetadata, setTokensDetailedMetadata, fetchMetadata } =
    useTokensMetadata();
  const usdPrices = useUSDPrices();

  const sync = useCallback(async () => {
    await makeSync(
      accountPkh,
      chainId,
      allTokensBaseMetadataRef,
      setTokensBaseMetadata,
      setTokensDetailedMetadata,
      usdPrices,
      fetchMetadata,
      networkIdRef.current === chainId ? tokens.concat(nfts) : [],
      mutate
    );
    if (networkIdRef.current !== chainId) {
      networkIdRef.current = chainId;
    }
  }, [
    accountPkh,
    chainId,
    allTokensBaseMetadataRef,
    setTokensBaseMetadata,
    setTokensDetailedMetadata,
    usdPrices,
    fetchMetadata,
    tokens,
    nfts,
    mutate
  ]);

  const syncRef = useRef(sync);
  useEffect(() => {
    syncRef.current = sync;
  }, [sync]);

  const networkIdRef = useRef(chainId);

  useEffect(() => {
    if (!chainId) {
      return;
    }

    const isTheSameNetwork = () => chainId === networkIdRef.current;
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
  }, [chainId, tokens, nfts]);

  return {
    sync,
    tokens,
    nfts
  };
});

const makeSync = async (
  accountPkh: string,
  chainId: string,
  allTokensBaseMetadataRef: any,
  setTokensBaseMetadata: any,
  setTokensDetailedMetadata: any,
  usdPrices: Record<string, string>,
  fetchMetadata: any,
  tzktTokens: TzktAccountToken[],
  mutate: ScopedMutator<any>
) => {
  if (!chainId) return;
  const mainnet = chainId === TempleChainId.Mainnet;

  const [displayedFungibleTokens, displayedCollectibleTokens, whitelistTokenSlugs] = await Promise.all([
    fetchDisplayedFungibleTokens(chainId, accountPkh),
    fetchCollectibleTokens(chainId, accountPkh, true),
    fetchWhitelistTokenSlugs(chainId)
  ]);

  const tzktTokensMap = new Map(
    tzktTokens.map(balance => [toTokenSlug(balance.token.contract.address, balance.token.tokenId), balance])
  );

  const displayedTokenSlugs = [...displayedFungibleTokens, ...displayedCollectibleTokens].map(
    ({ tokenSlug }) => tokenSlug
  );

  let tokenSlugs = [
    ...tzktTokens.map(balance => toTokenSlug(balance.token.contract.address, balance.token.tokenId)),
    ...displayedTokenSlugs,
    ...whitelistTokenSlugs,
    ...getPredefinedTokensSlugs(chainId)
  ].filter(onlyUnique);

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

  setTokensBaseMetadata(baseMetadatasToSet);
  setTokensDetailedMetadata(detailedMetadatasToSet);

  await Repo.accountTokens.bulkPut(
    tokenSlugs.map((slug, i) =>
      updateTokenSlugs(
        slug,
        i,
        chainId,
        accountPkh,
        existingRecords,
        tzktTokensMap,
        baseMetadatasToSet,
        allTokensBaseMetadataRef,
        usdPrices
      )
    ),
    tokenRepoKeys
  );

  mutate(['displayed-fungible-tokens', chainId, accountPkh]);
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
      try {
        localStorage.setItem(noMetadataFlag, 'true');
      } catch {}
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
  tzktTokensMap: Map<string, TzktAccountToken>,
  baseMetadatasToSet: any,
  allTokensBaseMetadataRef: any,
  usdPrices: Record<string, string>
) => {
  const existing = existingRecords[i];
  const tzktToken = tzktTokensMap.get(slug);
  const balance = tzktToken?.balance ?? '0';
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
      order: i,
      latestBalance: balance,
      latestUSDBalance: usdBalance
    };
  }

  const status = getPredefinedTokensSlugs(chainId).includes(slug) ? Repo.ITokenStatus.Enabled : Repo.ITokenStatus.Idle;

  return {
    type: metadata?.artifactUri ? Repo.ITokenType.Collectible : Repo.ITokenType.Fungible,
    order: i,
    chainId,
    account: accountPkh,
    tokenSlug: slug,
    status,
    addedAt: Date.now(),
    latestBalance: balance,
    latestUSDBalance: usdBalance
  };
};

function onlyUnique(value: string, index: number, self: string[]) {
  return self.indexOf(value) === index;
}
