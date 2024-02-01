import memoizee from 'memoizee';

import { fetchTokensMetadata, isKnownChainId } from 'lib/apis/temple';
import { fetchTzktAccountAssets } from 'lib/apis/tzkt';
import type { TzktAccountAsset } from 'lib/apis/tzkt/types';
import { toTokenSlug } from 'lib/assets';
import { isCollectible } from 'lib/metadata';
import type { FetchedMetadataRecord } from 'lib/metadata/fetch';

import { MetadataMap } from '../collectibles-metadata/state';

export const getAccountAssetsStoreKey = (account: string, chainId: string) => `${account}@${chainId}`;

export const isAccountAssetsStoreKeyOfSameChainIdAndDifferentAccount = (
  key: string,
  account: string,
  chainId: string
) => !key.startsWith(account) && key.endsWith(chainId);

export const loadAccountTokens = (account: string, chainId: string, knownMeta: MetadataMap) =>
  Promise.all([
    // Fetching assets known to be FTs, not checking metadata
    fetchTzktAccountAssets(account, chainId, true).then(data => finishTokensLoading(data, chainId, knownMeta)),
    // Fetching unknowns only, checking metadata to filter for FTs
    fetchTzktAccountUnknownAssets(account, chainId).then(data => finishTokensLoading(data, chainId, knownMeta, true))
  ]).then(
    ([data1, data2]) => mergeLoadedAssetsData(data1, data2),
    error => {
      console.error(error);
      throw error;
    }
  );

export const loadAccountCollectibles = (account: string, chainId: string, knownMeta: MetadataMap) =>
  Promise.all([
    // Fetching assets known to be NFTs, not checking metadata
    fetchTzktAccountAssets(account, chainId, false).then(data => finishCollectiblesLoadingWithMeta(data)),
    // Fetching unknowns only, checking metadata to filter for NFTs
    fetchTzktAccountUnknownAssets(account, chainId).then(data =>
      finishCollectiblesLoadingWithoutMeta(data, knownMeta, chainId)
    )
  ]).then(
    ([data1, data2]) => mergeLoadedAssetsData(data1, data2),
    error => {
      console.error(error);
      throw error;
    }
  );

const fetchTzktAccountUnknownAssets = memoizee(
  // Simply reducing frequency of requests per set of arguments.
  (account: string, chainId: string) => fetchTzktAccountAssets(account, chainId, null),
  { maxAge: 10_000, normalizer: ([account, chainId]) => `${account}_${chainId}`, promise: true }
);

const finishTokensLoading = async (
  data: TzktAccountAsset[],
  chainId: string,
  knownMeta: MetadataMap,
  fungibleByMetaCheck = false
) => {
  const slugsWithoutMeta = data.reduce<string[]>((acc, curr) => {
    const slug = tzktAssetToTokenSlug(curr);
    return knownMeta.has(slug) ? acc : acc.concat(slug);
  }, []);

  const newMetadatas = isKnownChainId(chainId)
    ? await fetchTokensMetadata(chainId, slugsWithoutMeta).catch(err => {
        console.error(err);
      })
    : null;

  const slugs: string[] = [];
  const balances: StringRecord = {};
  const newMeta: FetchedMetadataRecord = {};

  for (const asset of data) {
    const slug = tzktAssetToTokenSlug(asset);

    // Not optimal data pick, but we don't expect large arrays here
    const metadataOfNew = newMetadatas?.[slugsWithoutMeta.indexOf(slug)];

    if (fungibleByMetaCheck) {
      const metadata = metadataOfNew || knownMeta.get(slug);

      if (!metadata || isCollectible(metadata)) continue;
    }

    slugs.push(slug);
    balances[slug] = asset.balance;
    if (metadataOfNew) newMeta[slug] = metadataOfNew;
  }

  return { slugs, balances, newMeta };
};

const finishCollectiblesLoadingWithMeta = async (data: TzktAccountAsset[]) => {
  const slugs: string[] = [];
  const balances: StringRecord = {};

  for (const asset of data) {
    const slug = tzktAssetToTokenSlug(asset);

    slugs.push(slug);
    balances[slug] = asset.balance;
  }

  return { slugs, balances };
};

const finishCollectiblesLoadingWithoutMeta = async (
  data: TzktAccountAsset[],
  knownMeta: MetadataMap,
  chainId: string
) => {
  const slugsWithoutMeta = data.reduce<string[]>((acc, curr) => {
    const slug = tzktAssetToTokenSlug(curr);
    return knownMeta.has(slug) ? acc : acc.concat(slug);
  }, []);

  const newMetadatas = isKnownChainId(chainId)
    ? await fetchTokensMetadata(chainId, slugsWithoutMeta).catch(err => {
        console.error(err);
      })
    : null;

  const slugs: string[] = [];
  const balances: StringRecord = {};
  const newMeta: FetchedMetadataRecord = {};

  for (const asset of data) {
    const slug = tzktAssetToTokenSlug(asset);

    // Not optimal data pick, but we don't expect large arrays here
    const metadataOfNew = newMetadatas?.[slugsWithoutMeta.indexOf(slug)];
    const metadata = metadataOfNew || knownMeta.get(slug);

    if (!metadata || !isCollectible(metadata)) continue;

    if (metadataOfNew) newMeta[slug] = metadataOfNew;

    slugs.push(slug);
    balances[slug] = asset.balance;
  }

  return { slugs, balances, newMeta };
};

interface LoadedAssetsData {
  slugs: string[];
  balances: StringRecord;
  newMeta?: FetchedMetadataRecord;
}

const mergeLoadedAssetsData = (data1: LoadedAssetsData, data2: LoadedAssetsData) => ({
  slugs: data1.slugs.concat(data2.slugs),
  balances: { ...data1.balances, ...data2.balances },
  newMeta: { ...data1.newMeta, ...data2.newMeta }
});

const tzktAssetToTokenSlug = ({ token }: TzktAccountAsset) => toTokenSlug(token.contract.address, token.tokenId);
