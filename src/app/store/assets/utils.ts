import { fetchTokensMetadata, isKnownChainId, TokenMetadataResponse } from 'lib/apis/temple';
import { fetchTzktAccountAssets } from 'lib/apis/tzkt';
import { TzktAccountAsset } from 'lib/apis/tzkt/types';
import { toTokenSlug } from 'lib/assets';
import { isCollectible } from 'lib/metadata';

import type { MetadataRecords } from '../tokens-metadata/state';
import { LoadedCollectible } from './actions';

export const loadAccountTokens = (account: string, chainId: string, knownMeta: MetadataRecords) =>
  Promise.all([
    // Fetching assets known to be FTs, not checking metadata
    fetchTzktAccountAssets(account, chainId, true).then(data => finishTokensLoading(data, chainId, knownMeta)),
    // Fetching unknowns only, checking metadata to filter for FTs
    fetchTzktAccountAssets(account, chainId, null).then(data => finishTokensLoading(data, chainId, knownMeta, true))
  ]).then(
    ([data1, data2]) => mergeLoadedTokensData(data1, data2),
    error => {
      console.error(error);
      throw error;
    }
  );

export const loadAccountCollectibles = (account: string, chainId: string, knownMeta: MetadataRecords) =>
  Promise.all([
    // Fetching assets known to be NFTs, not checking metadata
    fetchTzktAccountAssets(account, chainId, false).then(data => finishCollectiblesLoadingWithMeta(data)),
    // Fetching unknowns only, checking metadata to filter for NFTs
    fetchTzktAccountAssets(account, chainId, null).then(data =>
      finishCollectiblesLoadingWithoutMeta(data, knownMeta, chainId)
    )
  ]).then(
    ([data1, data2]) => mergeLoadedCollectiblesData(data1, data2),
    error => {
      console.error(error);
      throw error;
    }
  );

const finishTokensLoading = async (
  data: TzktAccountAsset[],
  chainId: string,
  knownMeta: MetadataRecords,
  fungibleByMetaCheck = false
) => {
  const slugsWithoutMeta = data.reduce<string[]>((acc, curr) => {
    const slug = tzktAssetToTokenSlug(curr);
    return knownMeta[slug] ? acc : acc.concat(slug);
  }, []);

  const newMetadatas = isKnownChainId(chainId)
    ? await fetchTokensMetadata(chainId, slugsWithoutMeta).catch(err => {
        console.error(err);
      })
    : null;

  const slugs: string[] = [];
  const balances: StringRecord = {};
  const newMeta: Record<string, TokenMetadataResponse> = {};

  for (const asset of data) {
    const slug = tzktAssetToTokenSlug(asset);
    const metadataOfNew = newMetadatas?.[slugsWithoutMeta.indexOf(slug)];

    if (fungibleByMetaCheck) {
      const metadata = knownMeta[slug] || metadataOfNew;

      if (!metadata || isCollectible(metadata)) continue;
    }

    slugs.push(slug);
    balances[slug] = asset.balance;
    if (metadataOfNew) newMeta[slug] = metadataOfNew;
  }

  return { slugs, balances, newMeta };
};

const finishCollectiblesLoadingWithMeta = async (data: TzktAccountAsset[]) => {
  const collectibles: LoadedCollectible[] = [];
  const balances: StringRecord = {};

  for (const asset of data) {
    const slug = tzktAssetToTokenSlug(asset);

    collectibles.push({ slug });
    balances[slug] = asset.balance;
  }

  return { collectibles, balances };
};

const finishCollectiblesLoadingWithoutMeta = async (
  data: TzktAccountAsset[],
  knownMeta: MetadataRecords,
  chainId: string
) => {
  const slugsWithoutMeta = data.reduce<string[]>((acc, curr) => {
    const slug = tzktAssetToTokenSlug(curr);
    return knownMeta[slug] ? acc : acc.concat(slug);
  }, []);

  const newMetadatas = isKnownChainId(chainId)
    ? await fetchTokensMetadata(chainId, slugsWithoutMeta).catch(err => {
        console.error(err);
      })
    : null;

  const collectibles: LoadedCollectible[] = [];
  const balances: StringRecord = {};
  const newMeta: Record<string, TokenMetadataResponse> = {};

  for (const asset of data) {
    const slug = tzktAssetToTokenSlug(asset);

    const metadataOfNew = newMetadatas?.[slugsWithoutMeta.indexOf(slug)];
    const metadata = knownMeta[slug] || metadataOfNew;

    if (!metadata || !isCollectible(metadata)) continue;

    if (metadataOfNew) newMeta[slug] = metadataOfNew;

    collectibles.push({ slug });
    balances[slug] = asset.balance;
  }

  return { collectibles, balances, newMeta };
};

interface LoadedAssetsData {
  slugs: string[];
  balances: StringRecord;
  newMeta: Record<string, TokenMetadataResponse>;
}

const mergeLoadedTokensData = (data1: LoadedAssetsData, data2: LoadedAssetsData) => ({
  slugs: data1.slugs.concat(data2.slugs),
  balances: { ...data1.balances, ...data2.balances },
  newMeta: { ...data1.newMeta, ...data2.newMeta }
});

interface LoadedCollectiblesData {
  collectibles: LoadedCollectible[];
  balances: StringRecord;
  newMeta?: Record<string, TokenMetadataResponse>;
}

const mergeLoadedCollectiblesData = (data1: LoadedCollectiblesData, data2: LoadedCollectiblesData) => ({
  collectibles: data1.collectibles.concat(data2.collectibles),
  balances: { ...data1.balances, ...data2.balances },
  newMeta: { ...data1.newMeta, ...data2.newMeta }
});

const tzktAssetToTokenSlug = ({ token }: TzktAccountAsset) => toTokenSlug(token.contract.address, token.tokenId);
