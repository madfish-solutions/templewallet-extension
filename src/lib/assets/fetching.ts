import memoizee from 'memoizee';

import { isKnownChainId, fetchTokensMetadata as fetchTokensMetadataOnAPI } from 'lib/apis/temple';
import { TzktApiChainId, fetchTzktAccountAssets } from 'lib/apis/tzkt';
import { TzktAccountAssetSelectedParams } from 'lib/apis/tzkt/api';
import { toTokenSlug } from 'lib/assets';
import { FetchedMetadataRecord, fetchTokensMetadata } from 'lib/metadata/fetch';
import { MetadataMap } from 'lib/metadata/types';
import { isCollectible } from 'lib/metadata/utils';

export const loadAccountTokens = (account: string, chainId: TzktApiChainId, rpcUrl: string, knownMeta: MetadataMap) =>
  Promise.all([
    // Fetching assets known to be FTs, not checking metadata
    fetchTzktAccountAssets(account, chainId, true).then(data => finishTokensLoading(data, rpcUrl, chainId, knownMeta)),
    // Fetching unknowns only, checking metadata to filter for FTs
    fetchTzktAccountUnknownAssets(account, chainId).then(data =>
      finishTokensLoading(data, rpcUrl, chainId, knownMeta, true)
    )
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
  data: TzktAccountAssetSelectedParams[],
  rpcUrl: string,
  chainId: TzktApiChainId,
  knownMeta: MetadataMap,
  fungibleByMetaCheck = false
) => {
  const slugsWithoutMeta = data.reduce<string[]>((acc, curr) => {
    const slug = tzktAssetToTokenSlug(curr);
    return knownMeta.has(slug) ? acc : acc.concat(slug);
  }, []);

  const newMetadatas = await fetchTokensMetadata({ rpcBaseURL: rpcUrl, chainId }, slugsWithoutMeta).catch(err => {
    console.error(err);
  });

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
    balances[slug] = asset[2];
    if (metadataOfNew) newMeta[slug] = metadataOfNew;
  }

  return { slugs, balances, newMeta };
};

const finishCollectiblesLoadingWithMeta = async (data: TzktAccountAssetSelectedParams[]) => {
  const slugs: string[] = [];
  const balances: StringRecord = {};

  for (const asset of data) {
    const slug = tzktAssetToTokenSlug(asset);

    slugs.push(slug);
    balances[slug] = asset[2];
  }

  return { slugs, balances };
};

const finishCollectiblesLoadingWithoutMeta = async (
  data: TzktAccountAssetSelectedParams[],
  knownMeta: MetadataMap,
  chainId: string
) => {
  const slugsWithoutMeta = data.reduce<string[]>((acc, curr) => {
    const slug = tzktAssetToTokenSlug(curr);
    return knownMeta.has(slug) ? acc : acc.concat(slug);
  }, []);

  const newMetadatas = isKnownChainId(chainId)
    ? await fetchTokensMetadataOnAPI(chainId, slugsWithoutMeta).catch(err => {
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
    balances[slug] = asset[2];
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

const tzktAssetToTokenSlug = (data: TzktAccountAssetSelectedParams) => toTokenSlug(data[0], data[1]);
