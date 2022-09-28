import { useCallback, useState } from 'react';

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
import { fetchTzktTokens, TzktAccountToken } from 'lib/tzkt';

import { useTimerEffect } from '../../../app/hooks/useTimerEffect';
import { TempleChainId } from '../types';

const SYNC_INTERVAL = 60_000;

export const [SyncTokensProvider, useSyncTokens] = constate(() => {
  const { mutate } = useSWRConfig();
  const chainId = useChainId(true)!;
  const { publicKeyHash: accountPkh } = useAccount();

  const { allTokensBaseMetadataRef, setTokensBaseMetadata, setTokensDetailedMetadata, fetchMetadata } =
    useTokensMetadata();
  const usdPrices = useUSDPrices();

  const [isSync, setIsSync] = useState<boolean | null>(null);

  const sync = useCallback(async () => {
    console.log('sync start');
    setIsSync(true);

    await makeSync(
      accountPkh,
      chainId,
      allTokensBaseMetadataRef,
      setTokensBaseMetadata,
      setTokensDetailedMetadata,
      usdPrices,
      fetchMetadata,
      mutate
    );

    setIsSync(false);
    console.log('sync end');
  }, [
    accountPkh,
    chainId,
    allTokensBaseMetadataRef,
    setTokensBaseMetadata,
    setTokensDetailedMetadata,
    usdPrices,
    fetchMetadata,
    mutate
  ]);

  useTimerEffect(sync, SYNC_INTERVAL, [chainId, accountPkh]);

  return { isSync };
});

const makeSync = async (
  accountPkh: string,
  chainId: string,
  allTokensBaseMetadataRef: any,
  setTokensBaseMetadata: any,
  setTokensDetailedMetadata: any,
  usdPrices: Record<string, string>,
  fetchMetadata: any,
  mutate: ScopedMutator
) => {
  if (!chainId) return;

  const mainnet = chainId === TempleChainId.Mainnet;

  const [tzktTokens, displayedFungibleTokens, displayedCollectibleTokens, whitelistTokenSlugs] = await Promise.all([
    fetchTzktTokens(chainId, accountPkh),
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

  await mutate(['displayed-fungible-tokens', chainId, accountPkh]);
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
  existingRecords: Array<Repo.IAccountToken | undefined>,
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

const onlyUnique = (value: string, index: number, self: string[]) => self.indexOf(value) === index;
